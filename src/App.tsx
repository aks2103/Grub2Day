import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FoodieHeader } from './components/FoodieHeader';
import { FoodieDateStrip } from './components/FoodieDateStrip';
import { FoodieMealCard } from './components/FoodieMealCard';
import { FoodieSwapSheet } from './components/FoodieSwapSheet';
import { FoodiePantrySheet } from './components/FoodiePantrySheet';
import { HowToCookModal } from './components/HowToCookModal';
import { OnboardingModal } from './components/OnboardingModal';

import { getDatabase } from './db';
import { IDatabaseProvider } from './db/dbInterface';
import { DayMealPlan, Recipe, PantryState, MealSlot, UserHouseholdSettings } from './types';
import { getRollingSixDayPlans, cascadeReplanFutureDays, replanUpcomingSlotsFromPantry } from './services/rollingPlannerService';
import { getSwapOptions, updateMealSlot } from './services/mealPlannerService';
import { filterAvailableRecipes, getActiveCooldownReport } from './services/cooldownService';
import { getInspirationRecipes, getMissingIngredientsForRecipe, hasRequiredCoreIngredients } from './services/pantryService';
import { APP_CONFIG } from './config/env';
import { Sparkles, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [db, setDb] = useState<IDatabaseProvider | null>(null);
  const [todayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryState | null>(null);
  const [sixDayPlans, setSixDayPlans] = useState<DayMealPlan[]>([]);
  const [settings, setSettings] = useState<UserHouseholdSettings | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mutex ref to prevent self-triggered real-time subscription loops
  const isMutatingRef = useRef<boolean>(false);

  // Sheets & Modals
  const [pantrySheetOpen, setPantrySheetOpen] = useState(false);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [howToCookOpen, setHowToCookOpen] = useState(false);
  const [howToCookRecipe, setHowToCookRecipe] = useState<Recipe | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; slot: MealSlot }>({
    dayIndex: 0,
    slot: 'lunch',
  });
  const [swapOptions, setSwapOptions] = useState<Recipe[]>([]);
  const [allSlotRecipes, setAllSlotRecipes] = useState<Recipe[]>([]);

  // Wife Notification & Craving Preferences
  const [wifePhone, setWifePhone] = useState<string>(() => localStorage.getItem('wife_whatsapp_phone') || '');
  const [showWhatsAppShare, setShowWhatsAppShare] = useState<boolean>(() => {
    const saved = localStorage.getItem('show_whatsapp_share');
    return saved !== null ? saved === 'true' : true;
  });

  const handleUpdateWifePhone = (phone: string) => {
    setWifePhone(phone);
    localStorage.setItem('wife_whatsapp_phone', phone);
    showToast("📱 Partner's WhatsApp number saved!");
  };

  const handleToggleWhatsAppShare = (show: boolean) => {
    setShowWhatsAppShare(show);
    localStorage.setItem('show_whatsapp_share', String(show));
    if (show) {
      showToast("💬 WhatsApp sharing enabled");
    } else {
      showToast("❤️ WhatsApp removed. Pure Craving mode active!");
    }
  };

  const recipesMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, [recipes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const database = await getDatabase();
      setDb(database);

      const [allRecs, currentPantry, plans, currentSettings] = await Promise.all([
        database.getAllRecipes(),
        database.getPantry(),
        getRollingSixDayPlans(database, todayStr),
        database.getSettings(),
      ]);

      setRecipes(allRecs);
      setPantry(currentPantry);
      setSixDayPlans(plans);
      setSettings(currentSettings);
      if (currentSettings.wifeWhatsApp) {
        setWifePhone(currentSettings.wifeWhatsApp);
      }
      if (!currentSettings.isOnboarded) {
        setOnboardingOpen(true);
      }
      setIsLoading(false);

      // Real-time synchronization across devices (ignores local mutations)
      const unsub = database.subscribeToChanges(async (event) => {
        if (isMutatingRef.current) return;
        if (event.collection === 'meal_plans') {
          const refreshed = await getRollingSixDayPlans(database, todayStr);
          setSixDayPlans(refreshed);
        }
      });

      return () => {
        unsub();
      };
    }

    const cleanupPromise = init();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [todayStr]);

  // Actions
  const handleSwapClick = async (dayIndex: number, slot: MealSlot) => {
    if (!db || !sixDayPlans[dayIndex]) return;

    setSwapTarget({ dayIndex, slot });
    const targetPlan = sixDayPlans[dayIndex];
    const currentRecipeId = targetPlan[slot].recipeId;

    // Strict Global Anti-Repetition: Collect all recipe IDs across the 6 days
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

  const handleSelectSwapRecipe = async (newRecipeId: string, customSlot?: MealSlot, customDayIndex?: number) => {
    if (!db) return;
    isMutatingRef.current = true;
    const dayIndex = customDayIndex !== undefined ? customDayIndex : swapTarget.dayIndex;
    const slot = customSlot !== undefined ? customSlot : swapTarget.slot;
    const targetPlan = sixDayPlans[dayIndex];
    if (!targetPlan) {
      isMutatingRef.current = false;
      return;
    }

    const updatedPlan = await updateMealSlot(db, targetPlan.date, slot, {
      recipeId: newRecipeId,
      isCooked: false,
    });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updatedPlan;
    setSixDayPlans(updatedPlans);

    // Cascading replan: auto-replan future days to guarantee zero repetitions
    if (dayIndex < 5) {
      showToast("✨ Dish swapped! Future days re-planned for 6-day freshness...");
      setIsReplanning(true);
      const refreshedPlans = await cascadeReplanFutureDays(db, updatedPlans, dayIndex, todayStr);
      setSixDayPlans(refreshedPlans);
      setIsReplanning(false);
      showToast("✅ Next days re-planned! Zero repeats.");
    } else {
      showToast("✅ Dish updated!");
    }
    isMutatingRef.current = false;
  };

  const handleMarkCooked = async (dayIndex: number, slot: MealSlot, isCooked: boolean) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const updated = await updateMealSlot(db, targetPlan.date, slot, { isCooked });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updated;
    setSixDayPlans(updatedPlans);

    if (isCooked) {
      showToast("🍳 Cooked! 6-day cooldown active for this dish.");
    }
  };

  const handleToggleCraving = async (dayIndex: number, slot: MealSlot, isHusbandCraving: boolean) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const updated = await updateMealSlot(db, targetPlan.date, slot, { isHusbandCraving });

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updated;
    setSixDayPlans(updatedPlans);

    if (isHusbandCraving) {
      showToast("❤️ Marked as your craving for today!");
    } else {
      showToast("Craving cleared");
    }
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
      showToast("🍕 Dining Out tonight! Wife's kitchen is off.");
    }
  };

  const handleFullReplan = async () => {
    if (!db) return;
    setIsReplanning(true);
    showToast("Re-planning 6-day Pan-Indian menu...");
    const freshPlans = await cascadeReplanFutureDays(db, [null, null, null, null, null, null], -1, todayStr);
    setSixDayPlans(freshPlans);
    setIsReplanning(false);
    showToast("✨ Fresh 6-day cycle ready! Balanced & delicious.");
  };

  const handleUpdatePantry = async (updatedPantry: PantryState) => {
    if (!db) return;
    await db.savePantry(updatedPantry);
    setPantry(updatedPantry);
  };

  const handleApplyPantryUpdates = async () => {
    if (!db || !pantry) return;
    isMutatingRef.current = true;
    setIsReplanning(true);

    const { plans, affectedSlots } = await replanUpcomingSlotsFromPantry(
      db,
      sixDayPlans,
      todayStr,
      pantry
    );

    setSixDayPlans(plans);
    setIsReplanning(false);
    isMutatingRef.current = false;

    if (affectedSlots.includes('dinner') && affectedSlots.length === 1) {
      showToast("🧊 Tonight's dinner updated based on your fridge items!");
    } else if (affectedSlots.length > 0) {
      showToast(`🧊 Upcoming meals updated to use your fridge items!`);
    } else {
      showToast("✨ 6-day cycle synced with your fridge!");
    }
  };

  const handleCompleteOnboarding = async (newSettings: UserHouseholdSettings) => {
    if (!db) return;
    await db.saveSettings(newSettings);
    setSettings(newSettings);
    setWifePhone(newSettings.wifeWhatsApp);
    setOnboardingOpen(false);
    showToast(`✨ Welcome ${newSettings.husbandName} & ${newSettings.wifeName}! Customizing menu...`);
    await handleFullReplan();
  };

  // State for cycling through 💡 inspiration recipes per slot
  const [inspirationOffsets, setInspirationOffsets] = useState<{ breakfast: number; lunch: number; dinner: number }>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  const [menuViewMode, setMenuViewMode] = useState<'fridge' | 'inspiration'>('fridge');

  const selectedPlan = sixDayPlans[selectedDayIndex] || sixDayPlans[0] || null;

  const breakfastInspirations = useMemo(() => {
    if (!pantry || recipes.length === 0 || !selectedPlan) return [];
    const currentId = selectedPlan.breakfast?.recipeId;
    return getInspirationRecipes('breakfast', recipes, pantry, currentId);
  }, [recipes, pantry, selectedPlan?.breakfast?.recipeId]);

  const lunchInspirations = useMemo(() => {
    if (!pantry || recipes.length === 0 || !selectedPlan) return [];
    const currentId = selectedPlan.lunch?.recipeId;
    return getInspirationRecipes('lunch', recipes, pantry, currentId);
  }, [recipes, pantry, selectedPlan?.lunch?.recipeId]);

  const dinnerInspirations = useMemo(() => {
    if (!pantry || recipes.length === 0 || !selectedPlan) return [];
    const currentId = selectedPlan.dinner?.recipeId;
    return getInspirationRecipes('dinner', recipes, pantry, currentId);
  }, [recipes, pantry, selectedPlan?.dinner?.recipeId]);

  const currentBreakfastInspiration = useMemo(() => {
    if (breakfastInspirations.length === 0) return null;
    return breakfastInspirations[inspirationOffsets.breakfast % breakfastInspirations.length];
  }, [breakfastInspirations, inspirationOffsets.breakfast]);

  const currentLunchInspiration = useMemo(() => {
    if (lunchInspirations.length === 0) return null;
    return lunchInspirations[inspirationOffsets.lunch % lunchInspirations.length];
  }, [lunchInspirations, inspirationOffsets.lunch]);

  const currentDinnerInspiration = useMemo(() => {
    if (dinnerInspirations.length === 0) return null;
    return dinnerInspirations[inspirationOffsets.dinner % dinnerInspirations.length];
  }, [dinnerInspirations, inspirationOffsets.dinner]);

  const handleShuffleInspiration = (slot: MealSlot) => {
    setInspirationOffsets(prev => ({
      ...prev,
      [slot]: prev[slot] + 1
    }));
  };

  const handleSelectInspiration = async (slot: MealSlot, newRecipeId: string) => {
    if (!db) return;
    const rec = recipesMap.get(newRecipeId);
    await handleSelectSwapRecipe(newRecipeId, slot, selectedDayIndex);
    if (pantry && rec) {
      const missing = getMissingIngredientsForRecipe(rec, pantry);
      if (missing.length > 0) {
        showToast(`💡 Swapped to ${rec.name}! Need to get: ${missing.slice(0, 2).join(', ')} 🛒`);
      } else {
        showToast(`💡 Swapped to ${rec.name}!`);
      }
    }
  };

  if (isLoading || sixDayPlans.length === 0 || !pantry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl animate-bounce mb-3 shadow-sm">
          🍲
        </div>
        <p className="font-black text-slate-900 text-sm">Loading Grub2Day...</p>
        <p className="text-xs text-amber-700 font-semibold mt-0.5">Ghar Ka Swaad, Zero Repeat</p>
      </div>
    );
  }

  const selectedDateObj = new Date(selectedPlan.date);
  const dayTitle = selectedDayIndex === 0
    ? "Today's Family Meals"
    : selectedDateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-orange-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 max-w-sm text-center animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Foodie Header */}
      <FoodieHeader
        currentDateStr={todayStr}
        onOpenPantry={() => setPantrySheetOpen(true)}
        onReplanCycle={handleFullReplan}
        isReplanning={isReplanning}
        householdName={settings?.householdName}
        onOpenProfile={() => setOnboardingOpen(true)}
      />

      {/* Main Container tailored for iPhone 13 (max-w-md, px-3) */}
      <main className="flex-1 max-w-md w-full mx-auto px-3 pb-[max(var(--sab),28px)] flex flex-col">
        {/* Foodie 6-Day Strip (Responsive for iPhone 13) */}
        <FoodieDateStrip
          plans={sixDayPlans}
          selectedIndex={selectedDayIndex}
          onSelectIndex={setSelectedDayIndex}
          recipesMap={recipesMap}
        />

        {/* Day Headline & Foodie Vibe */}
        <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-orange-50/80 rounded-2xl p-2.5 border border-orange-200/70 mb-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Heart className="w-4 h-4 text-orange-500 fill-orange-500/20 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-black text-xs text-slate-900 truncate">
                {dayTitle}
              </h2>
              <p className="text-[11px] font-semibold text-amber-800 leading-tight truncate">
                {selectedDayIndex === 0
                  ? "Cooked with love, zero mental fatigue in the kitchen!"
                  : `Day ${selectedDayIndex + 1} of 6 • Guaranteed zero duplicate dishes.`}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-orange-800 border border-orange-200 shadow-2xs flex-shrink-0 ml-1.5">
            {selectedDayIndex === 0 ? 'Today' : `+${selectedDayIndex}d`}
          </span>
        </div>

        {/* View Switcher: Fridge Ready vs 💡 Food Inspiration */}
        <div className="bg-amber-100/70 p-1 rounded-2xl flex items-center gap-1 mb-2.5 border border-amber-200/80 shadow-2xs">
          <button
            onClick={() => setMenuViewMode('fridge')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              menuViewMode === 'fridge'
                ? 'bg-white text-orange-950 shadow-2xs'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <span>🧊</span>
            <span>From Fridge ({pantry?.availableVeggies.length || 0})</span>
          </button>
          <button
            onClick={() => setMenuViewMode('inspiration')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              menuViewMode === 'inspiration'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <span>💡</span>
            <span>Food Inspiration (Shop & Cook)</span>
          </button>
        </div>

        {/* 3 Foodie Meal Cards (Breakfast, Lunch, Dinner) */}
        <div className="space-y-3 flex-1">
          <FoodieMealCard
            slot="breakfast"
            entry={selectedPlan.breakfast}
            recipe={selectedPlan.breakfast.recipeId ? recipesMap.get(selectedPlan.breakfast.recipeId) : null}
            dayIndex={selectedDayIndex}
            onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'breakfast', isCooked)}
            onSwapClick={() => handleSwapClick(selectedDayIndex, 'breakfast')}
            onOpenHowToCook={(rec) => { setHowToCookRecipe(rec); setHowToCookOpen(true); }}
            onToggleCraving={(isCraving) => handleToggleCraving(selectedDayIndex, 'breakfast', isCraving)}
            wifePhone={wifePhone}
            showWhatsAppShare={showWhatsAppShare}
            onUpdateWifePhone={handleUpdateWifePhone}
            inspiration={currentBreakfastInspiration}
            onSelectInspiration={(id) => handleSelectInspiration('breakfast', id)}
            onShuffleInspiration={() => handleShuffleInspiration('breakfast')}
            isMissingInFridge={pantry && selectedPlan.breakfast.recipeId && recipesMap.get(selectedPlan.breakfast.recipeId) ? !hasRequiredCoreIngredients(recipesMap.get(selectedPlan.breakfast.recipeId)!, pantry) : false}
            missingIngredients={pantry && selectedPlan.breakfast.recipeId && recipesMap.get(selectedPlan.breakfast.recipeId) ? getMissingIngredientsForRecipe(recipesMap.get(selectedPlan.breakfast.recipeId)!, pantry) : []}
          />

          <FoodieMealCard
            slot="lunch"
            entry={selectedPlan.lunch}
            recipe={selectedPlan.lunch.recipeId ? recipesMap.get(selectedPlan.lunch.recipeId) : null}
            dayIndex={selectedDayIndex}
            onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'lunch', isCooked)}
            onSwapClick={() => handleSwapClick(selectedDayIndex, 'lunch')}
            onOpenHowToCook={(rec) => { setHowToCookRecipe(rec); setHowToCookOpen(true); }}
            onToggleCraving={(isCraving) => handleToggleCraving(selectedDayIndex, 'lunch', isCraving)}
            wifePhone={wifePhone}
            showWhatsAppShare={showWhatsAppShare}
            onUpdateWifePhone={handleUpdateWifePhone}
            inspiration={currentLunchInspiration}
            onSelectInspiration={(id) => handleSelectInspiration('lunch', id)}
            onShuffleInspiration={() => handleShuffleInspiration('lunch')}
            isMissingInFridge={pantry && selectedPlan.lunch.recipeId && recipesMap.get(selectedPlan.lunch.recipeId) ? !hasRequiredCoreIngredients(recipesMap.get(selectedPlan.lunch.recipeId)!, pantry) : false}
            missingIngredients={pantry && selectedPlan.lunch.recipeId && recipesMap.get(selectedPlan.lunch.recipeId) ? getMissingIngredientsForRecipe(recipesMap.get(selectedPlan.lunch.recipeId)!, pantry) : []}
          />

          <FoodieMealCard
            slot="dinner"
            entry={selectedPlan.dinner}
            recipe={selectedPlan.dinner.recipeId ? recipesMap.get(selectedPlan.dinner.recipeId) : null}
            dayIndex={selectedDayIndex}
            onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, 'dinner', isCooked)}
            onSwapClick={() => handleSwapClick(selectedDayIndex, 'dinner')}
            onOpenHowToCook={(rec) => { setHowToCookRecipe(rec); setHowToCookOpen(true); }}
            onToggleCraving={(isCraving) => handleToggleCraving(selectedDayIndex, 'dinner', isCraving)}
            onToggleDiningOut={(isOut) => handleToggleDiningOut(selectedDayIndex, isOut)}
            wifePhone={wifePhone}
            showWhatsAppShare={showWhatsAppShare}
            onUpdateWifePhone={handleUpdateWifePhone}
            inspiration={currentDinnerInspiration}
            onSelectInspiration={(id) => handleSelectInspiration('dinner', id)}
            onShuffleInspiration={() => handleShuffleInspiration('dinner')}
            isMissingInFridge={pantry && selectedPlan.dinner.recipeId && recipesMap.get(selectedPlan.dinner.recipeId) ? !hasRequiredCoreIngredients(recipesMap.get(selectedPlan.dinner.recipeId)!, pantry) : false}
            missingIngredients={pantry && selectedPlan.dinner.recipeId && recipesMap.get(selectedPlan.dinner.recipeId) ? getMissingIngredientsForRecipe(recipesMap.get(selectedPlan.dinner.recipeId)!, pantry) : []}
          />
        </div>
      </main>

      {/* How to Cook Modal (Step-by-step instructions + YouTube App Deep Link) */}
      <HowToCookModal
        isOpen={howToCookOpen}
        onClose={() => setHowToCookOpen(false)}
        recipe={howToCookRecipe}
      />

      {/* Foodie Bottom Sheet: Swap */}
      <FoodieSwapSheet
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
        pantry={pantry}
      />

      {/* Foodie Bottom Sheet: Pantry */}
      <FoodiePantrySheet
        isOpen={pantrySheetOpen}
        onClose={() => setPantrySheetOpen(false)}
        pantry={pantry}
        onUpdatePantry={handleUpdatePantry}
        onApply={handleApplyPantryUpdates}
        wifePhone={wifePhone}
        onUpdateWifePhone={handleUpdateWifePhone}
        showWhatsAppShare={showWhatsAppShare}
        onToggleWhatsAppShare={handleToggleWhatsAppShare}
      />

      {/* Household Sign-up & Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        initialSettings={settings}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
};
