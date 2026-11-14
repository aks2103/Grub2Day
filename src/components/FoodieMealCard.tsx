import React from 'react';
import { Check, RotateCcw, UtensilsCrossed, Clock, Dumbbell, Sparkles, Heart, MessageCircle, ShoppingCart } from 'lucide-react';
import { MealSlot, Recipe, MealSlotEntry } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { getLocalizedRecipe } from '../i18n/recipeLocalization';

interface FoodieMealCardProps {
  slot: MealSlot;
  entry: MealSlotEntry;
  recipe?: Recipe | null;
  dayIndex: number;
  onMarkCooked: (isCooked: boolean) => void;
  onSwapClick: () => void;
  onOpenHowToCook: (recipe: Recipe) => void;
  onToggleCraving?: (isCraving: boolean) => void;
  onToggleDiningOut?: (isDiningOut: boolean) => void;
  wifePhone?: string;
  showWhatsAppShare?: boolean;
  onUpdateWifePhone?: (phone: string) => void;
  isMissingInFridge?: boolean;
  missingIngredients?: string[];
  language?: 'en' | 'hi';
}

const SLOT_STYLES: Record<MealSlot, { emoji: string; accent: string; badge: string }> = {
  breakfast: {
    emoji: '🌅',
    accent: 'border-l-4 border-amber-400',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  lunch: {
    emoji: '☀️',
    accent: 'border-l-4 border-orange-500',
    badge: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  dinner: {
    emoji: '🌙',
    accent: 'border-l-4 border-rose-500',
    badge: 'bg-rose-100 text-rose-900 border-rose-200',
  },
};

const REGION_ICONS: Record<string, string> = {
  north: '🏔️',
  south: '🌴',
  west: '🌊',
  east: '🌾',
};

export const FoodieMealCard: React.FC<FoodieMealCardProps> = ({
  slot,
  entry,
  recipe,
  dayIndex,
  onMarkCooked,
  onSwapClick,
  onOpenHowToCook,
  onToggleCraving,
  onToggleDiningOut,
  wifePhone,
  showWhatsAppShare = true,
  onUpdateWifePhone,
  isMissingInFridge = false,
  missingIngredients = [],
  language = 'en',
}) => {
  const meta = SLOT_STYLES[slot];
  const t = TRANSLATIONS[language];

  const handleShareWithWife = () => {
    if (!recipe) return;
    let targetPhone = wifePhone || localStorage.getItem('wife_whatsapp_phone') || '';
    if (!targetPhone) {
      const promptText = language === 'hi'
        ? "व्हाट्सएप पर साझा करने के लिए साथी का 10-अंकों का नंबर दर्ज करें:\n(उदा. 9876543210)"
        : "Enter partner's 10-digit mobile number for 1-tap direct WhatsApp sharing:\n(e.g. 9876543210)";
      const entered = window.prompt(promptText, "");
      if (!entered || !entered.trim()) {
        return;
      }
      let cleaned = entered.replace(/\D/g, '');
      if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
      }
      localStorage.setItem('wife_whatsapp_phone', cleaned);
      targetPhone = cleaned;
      if (onUpdateWifePhone) {
        onUpdateWifePhone(cleaned);
      }
    }

    const loc = getLocalizedRecipe(recipe, language);
    const dishName = loc.name;
    const slotTitle = t[slot];
    const appUrl = window.location.origin;
    const needStr = isMissingInFridge && missingIngredients.length > 0 
      ? `\n🛒 ${t.needToGet}: ${missingIngredients.join(', ')}` 
      : '';
    const shareBody = t.whatsappShare(dishName, slotTitle, needStr, loc.husbandProteinBooster, appUrl);
    const text = encodeURIComponent(shareBody);
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  // Dining Out Card
  if (entry.isDiningOut) {
    return (
      <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/70 rounded-2xl border border-orange-200 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍕</span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800 block">
                {t[slot]}
              </span>
              <h3 className="text-sm font-black text-slate-900">
                {t.diningOutTitle}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-950 border border-orange-300">
            {t.kitchenOff}
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
          {language === 'hi'
            ? 'आज रात बाहर खाने का आनंद लें! रसोई की छुट्टी ✨'
            : 'Enjoying a relaxed meal outside! Kitchen is off tonight ✨'}
        </p>
        {onToggleDiningOut && (
          <button
            onClick={() => onToggleDiningOut(false)}
            className="text-xs font-bold text-orange-700 hover:text-orange-900 underline"
          >
            {t.resumeHomeCooking}
          </button>
        )}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-6 text-center text-slate-400">
        <p className="text-xs">{language === 'hi' ? 'कोई व्यंजन तय नहीं है' : 'No meal planned'}</p>
        <button
          onClick={onSwapClick}
          className="mt-2 text-xs font-bold text-orange-500 hover:underline"
        >
          {t.swapDish}
        </button>
      </div>
    );
  }

  const isCooked = entry.isCooked;
  const regionKey = (recipe.region || 'north') as 'north' | 'south' | 'west' | 'east';
  const regionLabel = t.regions[regionKey] || t.regions.north;
  const regionIcon = REGION_ICONS[regionKey] || '🏔️';
  const totalProtein = recipe.baseProteinGrams + recipe.addedProteinGrams;
  const loc = getLocalizedRecipe(recipe, language);
  const displayName = loc.name;

  return (
    <div className={`bg-white rounded-2xl border ${meta.accent} transition-all ${
      isCooked 
        ? 'border-emerald-300 bg-emerald-50/15 ring-2 ring-emerald-100 shadow-xs' 
        : 'border-orange-100/90 shadow-2xs hover:border-orange-300'
    } p-3.5 relative overflow-hidden`}>

      {/* Top Slot Header: Clean & Never Clips Cooking Time or Badges */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base">{meta.emoji}</span>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.badge}`}>
            {t[slot]}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-0.5">
            <span>{regionIcon}</span>
            <span>{regionLabel}</span>
          </span>
          {isMissingInFridge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
              <span>💡</span>
              <span>{t.inspirationBadge}</span>
            </span>
          )}
        </div>

        {/* Nutritional & Cooking Time Pills (Always Anchored & Fully Visible) */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black shadow-2xs">
            <Dumbbell className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span>{totalProtein}{t.proteinShort}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-900 border border-orange-200 text-[11px] font-bold shadow-2xs">
            <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
            <span>{recipe.prepTimeMinutes || 20}{t.minsShort}</span>
          </span>
        </div>
      </div>

      {/* Primary Dish Name (100% Strict: English in English mode, Hindi in Hindi mode) */}
      <div className="mb-1.5">
        <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
          {displayName}
        </h3>
        {isMissingInFridge && missingIngredients.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 text-[11px] font-bold border border-amber-300/80 mt-1.5">
            <ShoppingCart className="w-3 h-3 text-orange-600" />
            <span>{t.needToGet}: {missingIngredients.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Flavor Description */}
      <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
        {loc.description}
      </p>

      {/* Family Swaad: Kid Tip & Protein Boost */}
      <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/60 mb-2.5 space-y-1 text-xs">
        <div className="flex items-start gap-1.5 leading-snug text-amber-950">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">{t.forTheKids}: </span>
            <span className="text-amber-800">{loc.kidFriendlyTip}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 leading-snug text-slate-700 pt-1 border-t border-amber-200/50">
          <span className="font-bold text-slate-900 flex-shrink-0">{t.proteinBoost}: </span>
          <span className="text-slate-700">{loc.husbandProteinBooster}</span>
        </div>
      </div>

      {/* Craving & WhatsApp Sharing Bar */}
      {showWhatsAppShare ? (
        <div className="bg-gradient-to-r from-rose-50/80 to-amber-50/80 rounded-xl p-1.5 border border-rose-200/70 mb-2.5 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onToggleCraving && onToggleCraving(!entry.isHusbandCraving)}
            className={`h-9 px-2 rounded-lg text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
              entry.isHusbandCraving
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'bg-white hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
            title="Mark this as a craving today"
          >
            <Heart className={`w-3.5 h-3.5 flex-shrink-0 ${entry.isHusbandCraving ? 'fill-white text-white' : 'text-rose-500'}`} />
            <span className="truncate">{entry.isHusbandCraving ? t.markedCraving : t.cravingButton}</span>
          </button>

          <button
            onClick={handleShareWithWife}
            className="h-9 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            title="Send direct WhatsApp message to partner"
          >
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t.shareDish} 💬</span>
          </button>
        </div>
      ) : (
        <div className="mb-2.5">
          <button
            onClick={() => onToggleCraving && onToggleCraving(!entry.isHusbandCraving)}
            className={`w-full h-9 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
              entry.isHusbandCraving
                ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-200'
                : 'bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
            }`}
            title="Mark this as a craving today"
          >
            <Heart className={`w-3.5 h-3.5 ${entry.isHusbandCraving ? 'fill-white text-white' : 'text-rose-500'}`} />
            <span>{entry.isHusbandCraving ? t.markedCraving : t.cravingButton}</span>
          </button>
        </div>
      )}

      {/* Action Controls: Structured Clean Touch Targets (Uniform Across All Tabs) */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        {/* Row 1: How to Cook + Swap (50/50 Grid) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenHowToCook(recipe)}
            className="h-9 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-2xs"
            title="View cooking steps & YouTube video"
          >
            <span>{t.howToCook}</span>
          </button>

          <button
            onClick={onSwapClick}
            className="h-9 px-2 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 border border-orange-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
            title="Swap this dish"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <span>{t.swapDish}</span>
          </button>
        </div>

        {/* Row 2: Cooked Button (Today only) */}
        {dayIndex === 0 && (
          <button
            onClick={() => onMarkCooked(!isCooked)}
            className={`w-full h-9 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs ${
              isCooked
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isCooked ? t.markedAsCooked : t.cookedThis}</span>
          </button>
        )}

        {/* Dinner Dining out toggle */}
        {slot === 'dinner' && onToggleDiningOut && (
          <div className="text-center pt-0.5">
            <button
              onClick={() => onToggleDiningOut(true)}
              className="text-[11px] font-bold text-slate-500 hover:text-orange-700 active:scale-95 transition-colors inline-flex items-center gap-1 px-2 py-0.5"
            >
              <UtensilsCrossed className="w-3 h-3 text-orange-500" />
              <span>{t.diningOutPrompt}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
