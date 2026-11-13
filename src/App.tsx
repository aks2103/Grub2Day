import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { MealSlotCard } from './components/MealSlotCard';
import { SwapModal } from './components/SwapModal';
import { PantryView } from './components/PantryView';
import { CooldownHistoryView } from './components/CooldownHistoryView';
import { RecipeBankView } from './components/RecipeBankView';
import { NutritionSummaryBar } from './components/NutritionSummaryBar';

import { getDatabase } from './db';
import { IDatabaseProvider } from './db/dbInterface';
import { DayMealPlan, Recipe, PantryState, MealSlot } from './types';
import { getOrCreateDayPlan, getSwapOptions, updateMealSlot } from './services/mealPlannerService';
import { calculateDailyNutrition } from './services/nutritionService';
import { filterAvailableRecipes, getActiveCooldownReport } from './services/cooldownService';
import { APP_CONFIG } from './config/env';

export const App: React.FC = () => {
  const [db, setDb] = useState<IDatabaseProvider | null>(null);
  const [currentDateStr, setCurrentDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'today' | 'pantry' | 'history' | 'recipes'>('today');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryState | null>(null);
  const [dayPlan, setDayPlan] = useState<DayMealPlan | null>(null);
  const [history, setHistory] = useState<DayMealPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Swap Modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapSlot, setSwapSlot] = useState<MealSlot>('lunch');
  const [swapOptions, setSwapOptions] = useState<Recipe[]>([]);
  const [allSlotRecipes, setAllSlotRecipes] = useState<Recipe[]>([]);

  // Recipes lookup map
  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, [recipes]);

  // 1. Initialize Database on Mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      setIsLoading(true);
      const database = await getDatabase();
      setDb(database);

      // Load base collections
      const [allRecs, currentPantry] = await Promise.all([
        database.getAllRecipes(),
        database.getPantry(),
      ]);
      setRecipes(allRecs);
      setPantry(currentPantry);

      // Subscribe to changes
      unsubscribe = database.subscribeToChanges(() => {
        refreshCurrentView(database, currentDateStr);
      });

      await refreshCurrentView(database, currentDateStr);
      setIsLoading(false);
    }

    init();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Reload when Date Changes
  useEffect(() => {
    if (db) {
      refreshCurrentView(db, currentDateStr);
    }
  }, [currentDateStr, db]);

  const refreshCurrentView = async (database: IDatabaseProvider, dateStr: string) => {
    const [planRes, histRes, currentPantry, allRecs] = await Promise.all([
      getOrCreateDayPlan(database, dateStr),
      database.getMealHistory(APP_CONFIG.cooldownDays, dateStr),
      database.getPantry(),
      database.getAllRecipes(),
    ]);

    setDayPlan(planRes.plan);
    setHistory(histRes);
    setPantry(currentPantry);
    setRecipes(allRecs);
  };

  // Actions
  const handleMarkCooked = async (slot: MealSlot, isCooked: boolean) => {
    if (!db || !dayPlan) return;
    const updated = await updateMealSlot(db, currentDateStr, slot, { isCooked });
    setDayPlan(updated);
    // Refresh history so cooldown updates immediately
    const histRes = await db.getMealHistory(APP_CONFIG.cooldownDays, currentDateStr);
    setHistory(histRes);
  };

  const handleToggleProteinBooster = async (slot: MealSlot, hadBooster: boolean) => {
    if (!db || !dayPlan) return;
    const updated = await updateMealSlot(db, currentDateStr, slot, { 
      husbandHadProteinBooster: hadBooster 
    });
    setDayPlan(updated);
  };

  const handleToggleDiningOut = async (isDiningOut: boolean) => {
    if (!db || !dayPlan) return;
    const updated = await updateMealSlot(db, currentDateStr, 'dinner', {
      isDiningOut,
      isCooked: isDiningOut,
    });
    setDayPlan(updated);
  };

  const handleOpenSwapModal = async (slot: MealSlot) => {
    if (!db || !dayPlan) return;
    setSwapSlot(slot);
    const currentId = dayPlan[slot].recipeId;
    const options = await getSwapOptions(db, currentDateStr, slot, currentId);
    setSwapOptions(options);

    const cooldownReport = await getActiveCooldownReport(db, APP_CONFIG.cooldownDays, currentDateStr);
    const available = filterAvailableRecipes(recipes, cooldownReport, slot);
    setAllSlotRecipes(available);

    setSwapModalOpen(true);
  };

  const handleSelectSwapRecipe = async (recipeId: string) => {
    if (!db || !dayPlan) return;
    const updated = await updateMealSlot(db, currentDateStr, swapSlot, {
      recipeId,
      isCooked: false,
    });
    setDayPlan(updated);
  };

  const handleUpdatePantry = async (updatedPantry: PantryState) => {
    if (!db) return;
    await db.savePantry(updatedPantry);
    setPantry(updatedPantry);
  };

  const handleRegenerateWithPantry = async () => {
    if (!db) return;
    // Force re-pick for today's unc说过 dishes based on newly selected veggies
    await refreshCurrentView(db, currentDateStr);
    setActiveTab('today');
  };

  const handleAddCustomRecipe = async (recipe: Recipe) => {
    if (!db) return;
    await db.saveCustomRecipe(recipe);
    const updated = await db.getAllRecipes();
    setRecipes(updated);
  };

  // Nutrition Calculation for Today
  const nutritionSummary = useMemo(() => {
    if (!dayPlan) return null;
    return calculateDailyNutrition(
      dayPlan,
      recipesMap,
      APP_CONFIG.proteinTargetGrams,
      APP_CONFIG.calorieTarget
    );
  }, [dayPlan, recipesMap]);

  if (isLoading || !dayPlan || !pantry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl animate-bounce mb-3">
          🍲
        </div>
        <p className="font-extrabold text-slate-800 text-sm">Setting up Grub2Day...</p>
        <p className="text-xs text-slate-400 mt-1">Loading 60+ North Indian recipes & 6-day cooldown</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-amber-100">
      {/* Top Sticky Header */}
      <Navbar
        currentDateStr={currentDateStr}
        onDateChange={setCurrentDateStr}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5">
        {/* TAB 1: TODAY'S MENU */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Daily Recomp Tracker Bar */}
            {nutritionSummary && (
              <NutritionSummaryBar summary={nutritionSummary} />
            )}

            {/* Meal Slot Cards */}
            <div className="space-y-4">
              <MealSlotCard
                slot="breakfast"
                entry={dayPlan.breakfast}
                recipe={dayPlan.breakfast.recipeId ? recipesMap.get(dayPlan.breakfast.recipeId) : null}
                onMarkCooked={(isCooked) => handleMarkCooked('breakfast', isCooked)}
                onSwapClick={() => handleOpenSwapModal('breakfast')}
                onToggleProteinBooster={(had) => handleToggleProteinBooster('breakfast', had)}
              />

              <MealSlotCard
                slot="lunch"
                entry={dayPlan.lunch}
                recipe={dayPlan.lunch.recipeId ? recipesMap.get(dayPlan.lunch.recipeId) : null}
                onMarkCooked={(isCooked) => handleMarkCooked('lunch', isCooked)}
                onSwapClick={() => handleOpenSwapModal('lunch')}
                onToggleProteinBooster={(had) => handleToggleProteinBooster('lunch', had)}
              />

              <MealSlotCard
                slot="dinner"
                entry={dayPlan.dinner}
                recipe={dayPlan.dinner.recipeId ? recipesMap.get(dayPlan.dinner.recipeId) : null}
                onMarkCooked={(isCooked) => handleMarkCooked('dinner', isCooked)}
                onSwapClick={() => handleOpenSwapModal('dinner')}
                onToggleProteinBooster={(had) => handleToggleProteinBooster('dinner', had)}
                onToggleDiningOut={handleToggleDiningOut}
              />
            </div>
          </div>
        )}

        {/* TAB 2: PANTRY & FRIDGE */}
        {activeTab === 'pantry' && (
          <PantryView
            pantry={pantry}
            onUpdatePantry={handleUpdatePantry}
            onRegenerateWithPantry={handleRegenerateWithPantry}
          />
        )}

        {/* TAB 3: 6-DAY COOLDOWN HISTORY */}
        {activeTab === 'history' && (
          <CooldownHistoryView
            history={history}
            recipesMap={recipesMap}
            cooldownDays={APP_CONFIG.cooldownDays}
          />
        )}

        {/* TAB 4: RECIPE BANK */}
        {activeTab === 'recipes' && (
          <RecipeBankView
            recipes={recipes}
            onAddCustomRecipe={handleAddCustomRecipe}
          />
        )}
      </main>

      {/* 1-Tap Swap Modal */}
      <SwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        slot={swapSlot}
        currentRecipeName={dayPlan[swapSlot]?.recipeId ? recipesMap.get(dayPlan[swapSlot].recipeId!)?.name : undefined}
        options={swapOptions}
        allAvailableRecipes={allSlotRecipes}
        onSelectRecipe={handleSelectSwapRecipe}
      />
    </div>
  );
};
