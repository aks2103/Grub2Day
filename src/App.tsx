import React, { useState, useEffect, useMemo } from 'react';
import { FoodieHeader } from './components/FoodieHeader';
import { FoodieDateStrip } from './components/FoodieDateStrip';
import { FoodieMealCard } from './components/FoodieMealCard';
import { FoodieSwapSheet } from './components/FoodieSwapSheet';
import { FoodiePantrySheet } from './components/FoodiePantrySheet';
import { HowToCookModal } from './components/HowToCookModal';

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

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<PantryState | null>(null);
  const [sixDayPlans, setSixDayPlans] = useState<DayMealPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    showToast("📱 Wife's WhatsApp number saved!");
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

      const [allRecs, currentPantry, plans] = await Promise.all([
        database.getAllRecipes(),
        database.getPantry(),
        getRollingSixDayPlans(database, todayStr),
      ]);

      setRecipes(allRecs);
      setPantry(currentPantry);
      setSixDayPlans(plans);
      setIsLoading(false);

      // Real-time synchronization across devices
      const unsub = database.subscribeToChanges(async (event) => {
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
      showToast("✨ Dish swapped! Future days re-planned for 6-day freshness...");
      setIsReplanning(true);
      const refreshedPlans = await cascadeReplanFutureDays(db, updatedPlans, dayIndex, todayStr);
      setSixDayPlans(refreshedPlans);
      setIsReplanning(false);
      showToast("✅ Next days re-planned! Zero repeats.");
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

  const selectedPlan = sixDayPlans[selectedDayIndex] || sixDayPlans[0];
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
      />

      {/* Main Container tailored for iPhone 13 (max-w-md, px-4) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-[max(var(--sab),28px)] flex flex-col">
        {/* Foodie 6-Day Strip (Responsive for iPhone 13) */}
        <FoodieDateStrip
          plans={sixDayPlans}
          selectedIndex={selectedDayIndex}
          onSelectIndex={setSelectedDayIndex}
          recipesMap={recipesMap}
        />

        {/* Day Headline & Foodie Vibe */}
        <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-orange-50/80 rounded-2xl p-3 border border-orange-200/70 mb-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-orange-500 fill-orange-500/20 flex-shrink-0" />
            <div>
              <h2 className="font-black text-xs text-slate-900">
                {dayTitle}
              </h2>
              <p className="text-[11px] font-semibold text-amber-800 leading-tight">
                {selectedDayIndex === 0
                  ? "Cooked with love, zero mental fatigue for your wife!"
                  : `Day ${selectedDayIndex + 1} of 6 • Guaranteed zero duplicate dishes.`}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-orange-800 border border-orange-200 shadow-2xs flex-shrink-0">
            {selectedDayIndex === 0 ? 'Today' : `+${selectedDayIndex}d`}
          </span>
        </div>

        {/* 3 Foodie Meal Cards (Breakfast, Lunch, Dinner) */}
        <div className="space-y-3.5 flex-1">
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
      />

      {/* Foodie Bottom Sheet: Pantry */}
      <FoodiePantrySheet
        isOpen={pantrySheetOpen}
        onClose={() => setPantrySheetOpen(false)}
        pantry={pantry}
        onUpdatePantry={handleUpdatePantry}
        onApply={handleFullReplan}
        wifePhone={wifePhone}
        onUpdateWifePhone={handleUpdateWifePhone}
        showWhatsAppShare={showWhatsAppShare}
        onToggleWhatsAppShare={handleToggleWhatsAppShare}
      />
    </div>
  );
};
