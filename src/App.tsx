import React, { useState, useEffect, useMemo } from 'react';
import { IOSHeader } from './components/iOSHeader';
import { IOSDateStrip } from './components/iOSDateStrip';
import { IOSMealCard } from './components/iOSMealCard';
import { IOSSwapSheet } from './components/iOSSwapSheet';
import { IOSPantrySheet } from './components/iOSPantrySheet';

import { getDatabase } from './db';
import { IDatabaseProvider } from './db/dbInterface';
import { DayMealPlan, Recipe, PantryState, MealSlot } from './types';
import { getRollingSixDayPlans, cascadeReplanFutureDays } from './services/rollingPlannerService';
import { getSwapOptions, updateMealSlot } from './services/mealPlannerService';
import { filterAvailableRecipes, getActiveCooldownReport } from './services/cooldownService';
import { APP_CONFIG } from './config/env';

export const App: React.FC = () => {
  const [db, setDb] = useState<IDatabaseProvider | null>(null);
  const [todayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryState | null>(null);
  const [sixDayPlans, setSixDayPlans] = useState<DayMealPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);

  // Sheets
  const [pantrySheetOpen, setPantrySheetOpen] = useState(false);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; slot: MealSlot }>({
    dayIndex: 0,
    slot: 'lunch',
  });
  const [swapOptions, setSwapOptions] = useState<Recipe[]>([]);
  const [allSlotRecipes, setAllSlotRecipes] = useState<Recipe[]>([]);

  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, [recipes]);

  // 1. Initialize
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const database = await getDatabase();
      setDb(database);

      const [allRecs, currentPantry, plans] = await Promise.all([
        database.getAllRecipes(),
        database.getPantry(),
        getRollingSixDayPlans(database, todayStr),
      ]);

      setRecipes(allRecs);
      setPantry(currentPantry);
      setSixDayPlans(plans);
      setIsLoading(false);
    }

    init();
  }, [todayStr]);

  // Actions
  const handleSwapClick = async (dayIndex: number, slot: MealSlot) => {
    if (!db || !sixDayPlans[dayIndex]) return;

    setSwapTarget({ dayIndex, slot });
    const targetPlan = sixDayPlans[dayIndex];
    const currentRecipeId = targetPlan[slot].recipeId;

    // Collect all recipe IDs currently scheduled anywhere in the 6-day cycle
    const cycleUsed = new Set<string>();
    sixDayPlans.forEach(p => {
      if (p.breakfast.recipeId) cycleUsed.add(p.breakfast.recipeId);
      if (p.lunch.recipeId) cycleUsed.add(p.lunch.recipeId);
      if (p.dinner.recipeId) cycleUsed.add(p.dinner.recipeId);
    });
    if (currentRecipeId) cycleUsed.delete(currentRecipeId);

    const options = await getSwapOptions(db, targetPlan.date, slot, currentRecipeId, cycleUsed);
    setSwapOptions(options);

    const cooldownReport = await getActiveCooldownReport(db, APP_CONFIG.cooldownDays, targetPlan.date);
    const available = filterAvailableRecipes(recipes, cooldownReport, slot)
      .filter(r => !cycleUsed.has(r.id) && r.id !== currentRecipeId);
    setAllSlotRecipes(available.length > 0 ? available : filterAvailableRecipes(recipes, cooldownReport, slot));

    setSwapSheetOpen(true);
  };

  const handleSelectSwapRecipe = async (newRecipeId: string) => {
    if (!db) return;
    const { dayIndex, slot } = swapTarget;
    const targetPlan = sixDayPlans[dayIndex];

    const updatedPlan = await updateMealSlot(db, targetPlan.date, slot, {
      recipeId: newRecipeId,
      isCooked: false,
    });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updatedPlan;

    // Cascading replan: auto-replan future days to guarantee zero repetitions
    if (dayIndex < 5) {
      setIsReplanning(true);
      const refreshedPlans = await cascadeReplanFutureDays(db, updatedPlans, dayIndex, todayStr);
      setSixDayPlans(refreshedPlans);
      setIsReplanning(false);
    } else {
      setSixDayPlans(updatedPlans);
    }
  };

  const handleMarkCooked = async (dayIndex: number, slot: MealSlot, isCooked: boolean) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const updated = await updateMealSlot(db, targetPlan.date, slot, { isCooked });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updated;
    setSixDayPlans(updatedPlans);
  };

  const handleToggleDiningOut = async (dayIndex: number, isDiningOut: boolean) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const updated = await updateMealSlot(db, targetPlan.date, 'dinner', {
      isDiningOut,
      isCooked: isDiningOut,
    });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updated;
    setSixDayPlans(updatedPlans);
  };

  const handleFullReplan = async () => {
    if (!db) return;
    setIsReplanning(true);
    const freshPlans = await cascadeReplanFutureDays(db, [null, null, null, null, null, null], -1, todayStr);
    setSixDayPlans(freshPlans);
    setIsReplanning(false);
  };

  const handleUpdatePantry = async (updatedPantry: PantryState) => {
    if (!db) return;
    await db.savePantry(updatedPantry);
    setPantry(updatedPantry);
  };

  if (isLoading || sixDayPlans.length === 0 || !pantry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="font-bold text-neutral-800 text-sm">Loading Grub2Day...</p>
      </div>
    );
  }

  const selectedPlan = sixDayPlans[selectedDayIndex] || sixDayPlans[0];

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      {/* iOS Header */}
      <IOSHeader
        currentDateStr={todayStr}
        onOpenPantry={() => setPantrySheetOpen(true)}
        onReplanCycle={handleFullReplan}
        isReplanning={isReplanning}
      />

      {/* Main Container tailored for iPhone 13 (max-w-md, px-4) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-[max(var(--sab),24px)] flex flex-col">
        {/* iOS 6-Day Date Strip */}
        <IOSDateStrip
          plans={sixDayPlans}
          selectedIndex={selectedDayIndex}
          onSelectIndex={setSelectedDayIndex}
        />

        {/* 3 Clean iOS Meal Cards */}
        <div className="space-y-3 mt-1 flex-1">
          <IOSMealCard
            slot="breakfast"
            entry={selectedPlan.breakfast}
            recipe={selectedPlan.breakfast.recipeId ? recipesMap.get(selectedPlan.breakfast.recipeId) : null}
            dayIndex={selectedDayIndex}
            onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'breakfast', isCooked)}
            onSwapClick={() => handleSwapClick(selectedDayIndex, 'breakfast')}
          />

          <IOSMealCard
            slot="lunch"
            entry={selectedPlan.lunch}
            recipe={selectedPlan.lunch.recipeId ? recipesMap.get(selectedPlan.lunch.recipeId) : null}
            dayIndex={selectedDayIndex}
            onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'lunch', isCooked)}
            onSwapClick={() => handleSwapClick(selectedDayIndex, 'lunch')}
          />

          <IOSMealCard
            slot="dinner"
            entry={selectedPlan.dinner}
            recipe={selectedPlan.dinner.recipeId ? recipesMap.get(selectedPlan.dinner.recipeId) : null}
            dayIndex={selectedDayIndex}
            onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'dinner', isCooked)}
            onSwapClick={() => handleSwapClick(selectedDayIndex, 'dinner')}
            onToggleDiningOut={(isOut) => handleToggleDiningOut(selectedDayIndex, isOut)}
          />
        </div>
      </main>

      {/* iOS Bottom Sheet: Swap */}
      <IOSSwapSheet
        isOpen={swapSheetOpen}
        onClose={() => setSwapSheetOpen(false)}
        slot={swapTarget.slot}
        currentRecipeName={
          sixDayPlans[swapTarget.dayIndex]?.[swapTarget.slot]?.recipeId
            ? recipesMap.get(sixDayPlans[swapTarget.dayIndex][swapTarget.slot].recipeId!)?.name
            : undefined
        }
        options={swapOptions}
        allAvailableRecipes={allSlotRecipes}
        onSelectRecipe={handleSelectSwapRecipe}
      />

      {/* iOS Bottom Sheet: Pantry */}
      <IOSPantrySheet
        isOpen={pantrySheetOpen}
        onClose={() => setPantrySheetOpen(false)}
        pantry={pantry}
        onUpdatePantry={handleUpdatePantry}
        onApply={handleFullReplan}
      />
    </div>
  );
};
