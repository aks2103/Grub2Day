import React, { useState, useEffect, useMemo } from 'react';
import { HeaderClean } from './components/HeaderClean';
import { SixDayBar } from './components/SixDayBar';
import { EmotionalMealCard } from './components/EmotionalMealCard';
import { SwapModal } from './components/SwapModal';
import { PantryView } from './components/PantryView';
import { GeminiChefModal } from './components/GeminiChefModal';

import { getDatabase } from './db';
import { IDatabaseProvider } from './db/dbInterface';
import { DayMealPlan, Recipe, PantryState, MealSlot } from './types';
import { getRollingSixDayPlans, cascadeReplanFutureDays } from './services/rollingPlannerService';
import { getSwapOptions, updateMealSlot } from './services/mealPlannerService';
import { filterAvailableRecipes, getActiveCooldownReport } from './services/cooldownService';
import { APP_CONFIG } from './config/env';
import { Sparkles, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [db, setDb] = useState<IDatabaseProvider | null>(null);
  const [todayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryState | null>(null);
  const [sixDayPlans, setSixDayPlans] = useState<DayMealPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);

  // Modals
  const [pantryModalOpen, setPantryModalOpen] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [activeGeminiDish, setActiveGeminiDish] = useState('');

  // Swap Modal
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; slot: MealSlot }>({
    dayIndex: 0,
    slot: 'lunch',
  });
  const [swapOptions, setSwapOptions] = useState<Recipe[]>([]);
  const [allSlotRecipes, setAllSlotRecipes] = useState<Recipe[]>([]);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, [recipes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

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

    // Collect all recipe IDs currently scheduled anywhere in the 6-day cycle (breakfast, lunch, dinner)
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

    setSwapModalOpen(true);
  };

  const handleSelectSwapRecipe = async (newRecipeId: string) => {
    if (!db) return;
    const { dayIndex, slot } = swapTarget;
    const targetPlan = sixDayPlans[dayIndex];

    // 1. Update the chosen slot on this day
    const updatedPlan = await updateMealSlot(db, targetPlan.date, slot, {
      recipeId: newRecipeId,
      isCooked: false,
    });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updatedPlan;

    // 2. CASCADING RE-PLAN: If this wasn't the last day, replan subsequent days to prevent any clash!
    if (dayIndex < 5) {
      showToast("✨ Dish updated! Automatically re-planning subsequent days for 6-day freshness...");
      setIsReplanning(true);
      const refreshedPlans = await cascadeReplanFutureDays(db, updatedPlans, dayIndex, todayStr);
      setSixDayPlans(refreshedPlans);
      setIsReplanning(false);
      showToast("✅ Next 5 days re-planned! No repeats in your 6-day cycle.");
    } else {
      setSixDayPlans(updatedPlans);
      showToast("✅ Dish updated!");
    }
  };

  const handleMarkCooked = async (dayIndex: number, slot: MealSlot, isCooked: boolean) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const updated = await updateMealSlot(db, targetPlan.date, slot, { isCooked });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updated;
    setSixDayPlans(updatedPlans);

    if (isCooked) {
      showToast("🍳 Marked as Cooked! 6-day anti-repetition cooldown started.");
    }
  };

  const handleToggleProteinBooster = async (dayIndex: number, slot: MealSlot, hadBooster: boolean) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const updated = await updateMealSlot(db, targetPlan.date, slot, {
      husbandHadProteinBooster: hadBooster,
    });

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

    if (isDiningOut) {
      showToast("🍕 Dining Out tonight! Wife's kitchen is off for dinner.");
    }
  };

  const handleFullReplan = async () => {
    if (!db) return;
    setIsReplanning(true);
    showToast("Re-planning all 6 days with fresh variety...");
    // Fresh re-roll of days 0..5
    const freshPlans = await cascadeReplanFutureDays(db, [null, null, null, null, null, null], -1, todayStr);
    setSixDayPlans(freshPlans);
    setIsReplanning(false);
    showToast("✨ Fresh 6-day cycle planned! Balanced and ready.");
  };

  const handleUpdatePantry = async (updatedPantry: PantryState) => {
    if (!db) return;
    await db.savePantry(updatedPantry);
    setPantry(updatedPantry);
  };

  const handleRegenerateFromPantry = async () => {
    setPantryModalOpen(false);
    await handleFullReplan();
  };

  const handleOpenGeminiForDish = (dishName: string) => {
    setActiveGeminiDish(dishName);
    setGeminiModalOpen(true);
  };

  if (isLoading || sixDayPlans.length === 0 || !pantry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl animate-bounce mb-3">
          🍲
        </div>
        <p className="font-extrabold text-slate-800 text-sm">Preparing Your 6-Day Rasoi Plan...</p>
        <p className="text-xs text-slate-400 mt-1">Balancing North Indian home variety & high protein</p>
      </div>
    );
  }

  const selectedPlan = sixDayPlans[selectedDayIndex] || sixDayPlans[0];
  const selectedDateObj = new Date(selectedPlan.date);
  const selectedDateLabel = selectedDayIndex === 0
    ? "Today's Family Meals"
    : selectedDateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-amber-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-700 max-w-sm text-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Top Header */}
      <HeaderClean
        onOpenPantry={() => setPantryModalOpen(true)}
        onReplanCycle={handleFullReplan}
        onOpenGeminiChat={() => handleOpenGeminiForDish(selectedPlan.lunch.recipeId ? recipesMap.get(selectedPlan.lunch.recipeId)?.name || 'Today’s Lunch' : '')}
        isReplanning={isReplanning}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4">
        {/* 6-Day Horizontal Rolling Timeline */}
        <SixDayBar
          plans={sixDayPlans}
          selectedIndex={selectedDayIndex}
          onSelectIndex={setSelectedDayIndex}
          recipesMap={recipesMap}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
        />

        {/* SINGLE DAY VIEW */}
        {viewMode === 'single' ? (
          <div className="space-y-4">
            {/* Emotional Warmth Banner for Selected Day */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <div>
                  <h3 className="font-extrabold text-slate-900">
                    {selectedDateLabel}
                  </h3>
                  <p className="text-[11px] text-amber-900">
                    {selectedDayIndex === 0 
                      ? "Cooked with love, zero mental stress. Next 5 days already organized!" 
                      : `Day ${selectedDayIndex + 1} of your 6-day rolling cycle. Guaranteed no duplicate dishes.`}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800">
                {selectedDayIndex === 0 ? 'Today' : `+${selectedDayIndex} Days`}
              </span>
            </div>

            {/* 3 Meal Cards: Breakfast, Lunch, Dinner */}
            <div className="space-y-3.5">
              <EmotionalMealCard
                slot="breakfast"
                entry={selectedPlan.breakfast}
                recipe={selectedPlan.breakfast.recipeId ? recipesMap.get(selectedPlan.breakfast.recipeId) : null}
                dayIndex={selectedDayIndex}
                onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'breakfast', isCooked)}
                onSwapClick={() => handleSwapClick(selectedDayIndex, 'breakfast')}
                onToggleProteinBooster={(had) => handleToggleProteinBooster(selectedDayIndex, 'breakfast', had)}
                onAskGemini={handleOpenGeminiForDish}
              />

              <EmotionalMealCard
                slot="lunch"
                entry={selectedPlan.lunch}
                recipe={selectedPlan.lunch.recipeId ? recipesMap.get(selectedPlan.lunch.recipeId) : null}
                dayIndex={selectedDayIndex}
                onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'lunch', isCooked)}
                onSwapClick={() => handleSwapClick(selectedDayIndex, 'lunch')}
                onToggleProteinBooster={(had) => handleToggleProteinBooster(selectedDayIndex, 'lunch', had)}
                onAskGemini={handleOpenGeminiForDish}
              />

              <EmotionalMealCard
                slot="dinner"
                entry={selectedPlan.dinner}
                recipe={selectedPlan.dinner.recipeId ? recipesMap.get(selectedPlan.dinner.recipeId) : null}
                dayIndex={selectedDayIndex}
                onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'dinner', isCooked)}
                onSwapClick={() => handleSwapClick(selectedDayIndex, 'dinner')}
                onToggleProteinBooster={(had) => handleToggleProteinBooster(selectedDayIndex, 'dinner', had)}
                onToggleDiningOut={(isOut) => handleToggleDiningOut(selectedDayIndex, isOut)}
                onAskGemini={handleOpenGeminiForDish}
              />
            </div>
          </div>
        ) : (
          /* ALL 6 DAYS OVERVIEW */
          <div className="space-y-6">
            {sixDayPlans.map((plan, dayIdx) => {
              const dObj = new Date(plan.date);
              const isToday = dayIdx === 0;
              const dateTitle = isToday
                ? "Today's Meals"
                : dObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

              return (
                <div key={plan.date} className="border-b border-slate-100 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isToday ? 'bg-amber-500' : 'bg-slate-300'}`} />
                      <h3 className="font-extrabold text-sm text-slate-900">{dateTitle}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDayIndex(dayIdx);
                        setViewMode('single');
                      }}
                      className="text-xs text-amber-600 font-bold hover:underline"
                    >
                      Focus this day →
                    </button>
                  </div>

                  <div className="space-y-3">
                    <EmotionalMealCard
                      slot="breakfast"
                      entry={plan.breakfast}
                      recipe={plan.breakfast.recipeId ? recipesMap.get(plan.breakfast.recipeId) : null}
                      dayIndex={dayIdx}
                      onMarkCooked={(isCooked) => handleMarkCooked(dayIdx, 'breakfast', isCooked)}
                      onSwapClick={() => handleSwapClick(dayIdx, 'breakfast')}
                      onToggleProteinBooster={(had) => handleToggleProteinBooster(dayIdx, 'breakfast', had)}
                      onAskGemini={handleOpenGeminiForDish}
                    />

                    <EmotionalMealCard
                      slot="lunch"
                      entry={plan.lunch}
                      recipe={plan.lunch.recipeId ? recipesMap.get(plan.lunch.recipeId) : null}
                      dayIndex={dayIdx}
                      onMarkCooked={(isCooked) => handleMarkCooked(dayIdx, 'lunch', isCooked)}
                      onSwapClick={() => handleSwapClick(dayIdx, 'lunch')}
                      onToggleProteinBooster={(had) => handleToggleProteinBooster(dayIdx, 'lunch', had)}
                      onAskGemini={handleOpenGeminiForDish}
                    />

                    <EmotionalMealCard
                      slot="dinner"
                      entry={plan.dinner}
                      recipe={plan.dinner.recipeId ? recipesMap.get(plan.dinner.recipeId) : null}
                      dayIndex={dayIdx}
                      onMarkCooked={(isCooked) => handleMarkCooked(dayIdx, 'dinner', isCooked)}
                      onSwapClick={() => handleSwapClick(dayIdx, 'dinner')}
                      onToggleProteinBooster={(had) => handleToggleProteinBooster(dayIdx, 'dinner', had)}
                      onToggleDiningOut={(isOut) => handleToggleDiningOut(dayIdx, isOut)}
                      onAskGemini={handleOpenGeminiForDish}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 1-Tap Swap Modal (with Cascading Replan) */}
      <SwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
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

      {/* Fridge & Pantry Drawer Modal */}
      {pantryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-3 border-b">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>🧊</span>
                <span>Fridge & Pantry Check</span>
              </h3>
              <button
                onClick={() => setPantryModalOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Done
              </button>
            </div>
            <PantryView
              pantry={pantry}
              onUpdatePantry={handleUpdatePantry}
              onRegenerateWithPantry={handleRegenerateFromPantry}
            />
          </div>
        </div>
      )}

      {/* Gemini AI Sous Chef Modal */}
      <GeminiChefModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        currentDishName={activeGeminiDish}
      />
    </div>
  );
};
