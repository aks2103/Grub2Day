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
import { TRANSLATIONS } from './i18n/translations';
import { APP_CONFIG } from './config/env';
import { Sparkles, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

const SLOT_NAV_CONFIG: { slot: MealSlot; labelEn: string; labelHi: string; emoji: string }[] = [
  { slot: 'breakfast', labelEn: 'Breakfast', labelHi: 'नाश्ता', emoji: '🌅' },
  { slot: 'lunch', labelEn: 'Lunch', labelHi: 'दोपहर का खाना', emoji: '☀️' },
  { slot: 'dinner', labelEn: 'Dinner', labelHi: 'रात का खाना', emoji: '🌙' },
];

function getSmartInitialSlot(): MealSlot {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  return 'dinner';
}

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
    showToast(TRANSLATIONS[language].phoneSavedToast);
  };

  const handleToggleWhatsAppShare = (show: boolean) => {
    setShowWhatsAppShare(show);
    localStorage.setItem('show_whatsapp_share', String(show));
    if (show) {
      showToast(language === 'hi' ? "💬 व्हाट्सएप संदेश सक्रिय" : "💬 WhatsApp sharing enabled");
    } else {
      showToast(language === 'hi' ? "❤️ केवल पसंदीदा मोड सक्रिय" : "❤️ Pure Craving mode active!");
    }
  };

  // Language & Meal Slot Swipe Controls
  const [language, setLanguage] = useState<'en' | 'hi'>(() => {
    const saved = localStorage.getItem('grub2day_lang');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const [selectedMealSlot, setSelectedMealSlot] = useState<MealSlot>(getSmartInitialSlot);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      const currentIdx = SLOTS.indexOf(selectedMealSlot);
      if (deltaX < 0) {
        // Swiped Left -> Next Meal
        if (currentIdx < SLOTS.length - 1) {
          setSelectedMealSlot(SLOTS[currentIdx + 1]);
        }
      } else {
        // Swiped Right -> Previous Meal
        if (currentIdx > 0) {
          setSelectedMealSlot(SLOTS[currentIdx - 1]);
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handlePrevSlot = () => {
    const idx = SLOTS.indexOf(selectedMealSlot);
    if (idx > 0) setSelectedMealSlot(SLOTS[idx - 1]);
  };

  const handleNextSlot = () => {
    const idx = SLOTS.indexOf(selectedMealSlot);
    if (idx < SLOTS.length - 1) setSelectedMealSlot(SLOTS[idx + 1]);
  };

  const handleToggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
    localStorage.setItem('grub2day_lang', next);
    if (db && settings) {
      db.saveSettings({ ...settings, language: next }).catch(console.error);
    }
    showToast(TRANSLATIONS[next].langSwitched);
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

    const chosenRec = recipesMap.get(newRecipeId);
    const dishName = chosenRec
      ? (language === 'hi' ? (chosenRec.hindiName || chosenRec.name) : chosenRec.name)
      : '';

    // Cascading replan: auto-replan future days to guarantee zero repetitions
    if (dayIndex < 5) {
      showToast(TRANSLATIONS[language].swappedToast(dishName));
      setIsReplanning(true);
      const refreshedPlans = await cascadeReplanFutureDays(db, updatedPlans, dayIndex, todayStr);
      setSixDayPlans(refreshedPlans);
      setIsReplanning(false);
    } else {
      showToast(TRANSLATIONS[language].swappedToast(dishName));
    }
    isMutatingRef.current = false;
  };

  const handleMarkCooked = async (dayIndex: number, slot: MealSlot, isCooked: boolean, activeRecipeId?: string) => {
    if (!db || !sixDayPlans[dayIndex]) return;
    const targetPlan = sixDayPlans[dayIndex];
    const patch: Partial<DayMealPlan[MealSlot]> = { isCooked };
    if (activeRecipeId && activeRecipeId !== targetPlan[slot].recipeId) {
      patch.recipeId = activeRecipeId;
    }
    const updated = await updateMealSlot(db, targetPlan.date, slot, patch);

    const updatedPlans = [...sixDayPlans];
    updatedPlans[dayIndex] = updated;
    setSixDayPlans(updatedPlans);

    if (isCooked) {
      showToast(TRANSLATIONS[language].cookedToast);
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
      showToast(TRANSLATIONS[language].cravingAdded);
    } else {
      showToast(TRANSLATIONS[language].cravingCleared);
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
      showToast(TRANSLATIONS[language].diningOutToast);
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

    const { plans } = await replanUpcomingSlotsFromPantry(
      db,
      sixDayPlans,
      todayStr,
      pantry
    );

    setSixDayPlans(plans);
    setIsReplanning(false);
    isMutatingRef.current = false;

    showToast(TRANSLATIONS[language].fridgeSynced);
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
  const [inspirationOffsets] = useState<{ breakfast: number; lunch: number; dinner: number }>({
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

  const t = TRANSLATIONS[language];
  const selectedDateObj = new Date(selectedPlan.date);
  const dayTitle = selectedDayIndex === 0
    ? t.todayFamilyMeals
    : selectedDateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-orange-100">
      {/* Toast Notification & Replanning Indicator */}
      {isReplanning && !toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-orange-500 animate-in fade-in slide-in-from-top-2">
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span>{language === 'hi' ? '6-दिन का चक्र अपडेट हो रहा है...' : 'Updating 6-day cycle...'}</span>
        </div>
      )}
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
        householdName={settings?.householdName}
        onOpenProfile={() => setOnboardingOpen(true)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Container Responsive for Mobile, Tablet, and Web */}
      <main className="flex-1 max-w-md sm:max-w-xl md:max-w-2xl w-full mx-auto px-3 sm:px-4 pb-[max(var(--sab),28px)] flex flex-col">
        {/* Foodie 6-Day Strip (Responsive for iPhone 13) */}
        <FoodieDateStrip
          plans={sixDayPlans}
          selectedIndex={selectedDayIndex}
          onSelectIndex={setSelectedDayIndex}
          recipesMap={recipesMap}
          language={language}
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
                  ? t.cookedWithLove
                  : t.dayOfCycle(selectedDayIndex + 1)}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-orange-800 border border-orange-200 shadow-2xs flex-shrink-0 ml-1.5">
            {selectedDayIndex === 0 ? t.today : `+${selectedDayIndex}d`}
          </span>
        </div>

        {/* View Switcher: In Fridge vs 💡 Food Inspiration */}
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
            <span>{t.inFridge}</span>
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
            <span>{t.foodInspiration}</span>
          </button>
        </div>

        {/* Level 2: Meal Time Slot Segmented Tabs (Breakfast, Lunch, Dinner) */}
        <div className="flex items-center gap-1.5 p-1 bg-amber-50/90 rounded-2xl border border-amber-200/80 mb-2 shadow-2xs">
          {SLOT_NAV_CONFIG.map(({ slot, labelEn, labelHi, emoji }) => {
            const isSelected = selectedMealSlot === slot;
            const entry = selectedPlan[slot];
            const isCooked = entry.isCooked;
            const isCraving = entry.isHusbandCraving;
            const isDiningOut = slot === 'dinner' && entry.isDiningOut;

            return (
              <button
                key={slot}
                onClick={() => setSelectedMealSlot(slot)}
                className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-orange-50 text-slate-700 border border-orange-100'
                }`}
              >
                <span className="text-sm">{emoji}</span>
                <span className="truncate">{language === 'hi' ? labelHi : labelEn}</span>
                {isCooked && (
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                  }`}>
                    ✓
                  </span>
                )}
                {isCraving && !isCooked && (
                  <span className="text-[10px]">❤️</span>
                )}
                {isDiningOut && (
                  <span className="text-[10px]">🍕</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Single Swipeable Meal Card (Zero Vertical Clutter) */}
        <div 
          className="flex-1 transition-all duration-200 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {(() => {
            const displayRecipe = (() => {
              if (selectedMealSlot === 'breakfast') {
                return menuViewMode === 'inspiration' && currentBreakfastInspiration
                  ? currentBreakfastInspiration.recipe
                  : (selectedPlan.breakfast.recipeId ? recipesMap.get(selectedPlan.breakfast.recipeId) : null);
              }
              if (selectedMealSlot === 'lunch') {
                return menuViewMode === 'inspiration' && currentLunchInspiration
                  ? currentLunchInspiration.recipe
                  : (selectedPlan.lunch.recipeId ? recipesMap.get(selectedPlan.lunch.recipeId) : null);
              }
              return menuViewMode === 'inspiration' && currentDinnerInspiration
                ? currentDinnerInspiration.recipe
                : (selectedPlan.dinner.recipeId ? recipesMap.get(selectedPlan.dinner.recipeId) : null);
            })();

            return (
              <FoodieMealCard
                key={selectedMealSlot}
                slot={selectedMealSlot}
                entry={selectedPlan[selectedMealSlot]}
                recipe={displayRecipe}
                dayIndex={selectedDayIndex}
                onMarkCooked={(isCooked) => handleMarkCooked(selectedDayIndex, selectedMealSlot, isCooked, displayRecipe?.id)}
                onSwapClick={() => handleSwapClick(selectedDayIndex, selectedMealSlot)}
                onOpenHowToCook={(rec) => { setHowToCookRecipe(rec); setHowToCookOpen(true); }}
                onToggleCraving={(isCraving) => handleToggleCraving(selectedDayIndex, selectedMealSlot, isCraving)}
                onToggleDiningOut={selectedMealSlot === 'dinner' ? (isOut) => handleToggleDiningOut(selectedDayIndex, isOut) : undefined}
                wifePhone={wifePhone}
                showWhatsAppShare={showWhatsAppShare}
                onUpdateWifePhone={handleUpdateWifePhone}
                isMissingInFridge={pantry && displayRecipe ? !hasRequiredCoreIngredients(displayRecipe, pantry) : false}
                missingIngredients={pantry && displayRecipe ? getMissingIngredientsForRecipe(displayRecipe, pantry, language) : []}
                language={language}
              />
            );
          })()}
        </div>

        {/* Bottom Pagination & Swipe Navigation Bar */}
        <div className="flex items-center justify-between pt-2 px-1 text-slate-500 text-xs">
          <button
            onClick={handlePrevSlot}
            disabled={selectedMealSlot === 'breakfast'}
            className={`p-1.5 px-2.5 rounded-xl border flex items-center gap-1 font-bold transition-all ${
              selectedMealSlot === 'breakfast'
                ? 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
                : 'bg-white border-orange-200 text-orange-950 hover:bg-orange-50 active:scale-95 shadow-2xs'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-[11px] font-extrabold hidden xs:inline">{t.prevMeal}</span>
          </button>

          {/* Dots / Segment indicators */}
          <div className="flex items-center gap-1.5">
            {SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedMealSlot(s)}
                className={`transition-all rounded-full ${
                  selectedMealSlot === s
                    ? 'w-5 h-2 bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'w-2 h-2 bg-orange-200 hover:bg-orange-300'
                }`}
                title={`Go to ${s}`}
              />
            ))}
            <span className="text-[10px] text-slate-400 font-semibold ml-1">
              {t.swipeHint}
            </span>
          </div>

          <button
            onClick={handleNextSlot}
            disabled={selectedMealSlot === 'dinner'}
            className={`p-1.5 px-2.5 rounded-xl border flex items-center gap-1 font-bold transition-all ${
              selectedMealSlot === 'dinner'
                ? 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
                : 'bg-white border-orange-200 text-orange-950 hover:bg-orange-50 active:scale-95 shadow-2xs'
            }`}
          >
            <span className="text-[11px] font-extrabold hidden xs:inline">{t.nextMeal}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* How to Cook Modal (Step-by-step instructions + YouTube App Deep Link) */}
      <HowToCookModal
        isOpen={howToCookOpen}
        onClose={() => setHowToCookOpen(false)}
        recipe={howToCookRecipe}
        language={language}
      />

      {/* Foodie Bottom Sheet: Swap */}
      <FoodieSwapSheet
        isOpen={swapSheetOpen}
        onClose={() => setSwapSheetOpen(false)}
        slot={swapTarget.slot}
        currentRecipeName={
          sixDayPlans[swapTarget.dayIndex]?.[swapTarget.slot]?.recipeId
            ? (() => {
                const rec = recipesMap.get(sixDayPlans[swapTarget.dayIndex][swapTarget.slot].recipeId!);
                if (!rec) return undefined;
                return language === 'hi' ? (rec.hindiName || rec.name) : rec.name;
              })()
            : undefined
        }
        options={swapOptions}
        allAvailableRecipes={allSlotRecipes}
        onSelectRecipe={handleSelectSwapRecipe}
        pantry={pantry}
        language={language}
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
        language={language}
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
