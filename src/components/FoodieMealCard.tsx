import React from 'react';
import { Check, RotateCcw, UtensilsCrossed, Clock, Dumbbell, Sparkles, Heart, MessageCircle, ShoppingCart } from 'lucide-react';
import { MealSlot, Recipe, MealSlotEntry } from '../types';

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
  inspiration?: { recipe: Recipe; missingIngredients: string[] } | null;
  onSelectInspiration?: (recipeId: string) => void;
  onShuffleInspiration?: () => void;
  isMissingInFridge?: boolean;
  missingIngredients?: string[];
}

const SLOT_STYLES: Record<MealSlot, { title: string; emoji: string; accent: string; badge: string }> = {
  breakfast: {
    title: 'Breakfast',
    emoji: '🌅',
    accent: 'border-l-4 border-amber-400',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  lunch: {
    title: 'Lunch',
    emoji: '☀️',
    accent: 'border-l-4 border-orange-500',
    badge: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  dinner: {
    title: 'Dinner',
    emoji: '🌙',
    accent: 'border-l-4 border-rose-500',
    badge: 'bg-rose-100 text-rose-900 border-rose-200',
  },
};

const REGION_BADGES: Record<string, { label: string; icon: string }> = {
  north: { label: 'North', icon: '🏔️' },
  south: { label: 'South', icon: '🌴' },
  west: { label: 'West', icon: '🌊' },
  east: { label: 'East', icon: '🌾' },
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
  inspiration,
  onSelectInspiration,
  onShuffleInspiration,
  isMissingInFridge = false,
  missingIngredients = [],
}) => {
  const meta = SLOT_STYLES[slot];

  const handleShareWithWife = () => {
    if (!recipe) return;
    let targetPhone = wifePhone || localStorage.getItem('wife_whatsapp_phone') || '';
    if (!targetPhone) {
      const entered = window.prompt(
        "Enter partner's 10-digit mobile number for 1-tap direct WhatsApp sharing:\n(e.g. 9876543210)",
        ""
      );
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

    const mealName = recipe.hindiName ? `${recipe.name} (${recipe.hindiName})` : recipe.name;
    const slotTitle = meta.title;
    const appUrl = window.location.origin;
    const text = encodeURIComponent(
      `Hey! Aaj ${slotTitle} mein *${mealName}* khane ka mann hai 😋❤️\n\nProtein Boost: ${recipe.husbandProteinBooster}\n\nCheck on Grub2Day: ${appUrl}`
    );
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  const handleShareInspiration = (inspRecipe: Recipe, missingIngs: string[]) => {
    let targetPhone = wifePhone || localStorage.getItem('wife_whatsapp_phone') || '';
    if (!targetPhone) {
      const entered = window.prompt(
        "Enter partner's 10-digit mobile number for 1-tap direct WhatsApp sharing:\n(e.g. 9876543210)",
        ""
      );
      if (!entered || !entered.trim()) return;
      let cleaned = entered.replace(/\D/g, '');
      if (cleaned.length === 10) cleaned = '91' + cleaned;
      localStorage.setItem('wife_whatsapp_phone', cleaned);
      targetPhone = cleaned;
      if (onUpdateWifePhone) onUpdateWifePhone(cleaned);
    }

    const mealName = inspRecipe.hindiName ? `${inspRecipe.name} (${inspRecipe.hindiName})` : inspRecipe.name;
    const slotTitle = meta.title;
    const appUrl = window.location.origin;
    const missingStr = missingIngs.length > 0 ? `🛒 Need to get: ${missingIngs.join(', ')}\n` : '';
    const text = encodeURIComponent(
      `Hey! Aaj ${slotTitle} mein *${mealName}* khane ka mann kar raha hai 💡😋\n${missingStr}Protein: ${inspRecipe.baseProteinGrams + inspRecipe.addedProteinGrams}g\n\nCheck on Grub2Day: ${appUrl}`
    );
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
                {meta.title}
              </span>
              <h3 className="text-sm font-black text-slate-900">
                Dining Out Tonight
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-950 border border-orange-300">
            Kitchen Off! ✨
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
          Enjoying a relaxed meal outside! Kitchen is off tonight ✨ Quick and light bites for the little ones.
        </p>
        {onToggleDiningOut && (
          <button
            onClick={() => onToggleDiningOut(false)}
            className="text-xs font-bold text-orange-700 hover:text-orange-900 underline"
          >
            Cancel Dining Out (Cook at Home)
          </button>
        )}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-4 text-center">
        <span className="text-xs font-bold text-slate-400 block mb-1.5">{meta.title}</span>
        <p className="text-xs text-slate-500 mb-2.5">No dish selected yet</p>
        <button
          onClick={onSwapClick}
          className="h-8 px-4 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-xs hover:bg-orange-600 active:scale-95 transition-all"
        >
          Pick a Meal
        </button>
      </div>
    );
  }

  const isCooked = entry.isCooked;
  const region = recipe.region ? REGION_BADGES[recipe.region] : REGION_BADGES.north;
  const totalProtein = recipe.baseProteinGrams + recipe.addedProteinGrams;

  return (
    <div className={`bg-white rounded-2xl border ${meta.accent} transition-all ${
      isCooked 
        ? 'border-emerald-300 bg-emerald-50/15 ring-2 ring-emerald-100 shadow-xs' 
        : 'border-orange-100/90 shadow-2xs hover:border-orange-300'
    } p-3.5 relative overflow-hidden`}>

      {/* Top Slot Header: Clean Single Row (Never Wraps) */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-base">{meta.emoji}</span>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.badge}`}>
            {meta.title}
          </span>
          {region && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-0.5">
              <span>{region.icon}</span>
              <span>{region.label}</span>
            </span>
          )}
          {isMissingInFridge && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
              <span>💡</span>
              <span>Inspiration</span>
            </span>
          )}
        </div>

        {/* Nutritional Pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
            <Dumbbell className="w-3 h-3 text-emerald-600" />
            {totalProtein}g
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400 font-semibold">
            <Clock className="w-3 h-3" />
            {recipe.prepTimeMinutes}m
          </span>
        </div>
      </div>

      {/* Dish Name & Hindi */}
      <div className="mb-1.5">
        <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
          {recipe.name}
        </h3>
        {recipe.hindiName && (
          <span className="text-xs font-bold text-amber-700 block mt-0.5">
            {recipe.hindiName}
          </span>
        )}
        {isMissingInFridge && missingIngredients.length > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 text-[11px] font-bold border border-amber-300/80 mt-1.5">
            <ShoppingCart className="w-3 h-3 text-orange-600" />
            <span>Need to get: {missingIngredients.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Appetizing Flavor Description */}
      <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
        {recipe.description}
      </p>

      {/* Family Swaad: Kid Tip & Protein Boost */}
      <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/60 mb-2.5 space-y-1 text-xs">
        <div className="flex items-start gap-1.5 leading-snug text-amber-950">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">For the Kids: </span>
            <span className="text-amber-800">{recipe.kidFriendlyTip}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 leading-snug text-slate-700 pt-1 border-t border-amber-200/50">
          <span className="font-bold text-slate-900 flex-shrink-0">Protein Boost: </span>
          <span className="text-slate-700">{recipe.husbandProteinBooster}</span>
        </div>
      </div>

      {/* Craving & WhatsApp Sharing Bar: Balanced 50/50 Grid (Never Truncates) */}
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
            <span className="truncate">{entry.isHusbandCraving ? "Craving ❤️" : 'Craving?'}</span>
          </button>

          <button
            onClick={handleShareWithWife}
            className="h-9 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            title="Send direct WhatsApp message to partner"
          >
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Share 💬</span>
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
            <span>{entry.isHusbandCraving ? "Marked as Craving Today ❤️" : 'Craving this dish today?'}</span>
          </button>
        </div>
      )}

      {/* Action Controls: Structured Clean Touch Targets */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        {/* Row 1: How to Cook + Swap (50/50 Grid) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenHowToCook(recipe)}
            className="h-9 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-2xs"
            title="View cooking steps & YouTube video"
          >
            <span>How to Cook 🍳</span>
          </button>

          <button
            onClick={onSwapClick}
            className="h-9 px-2 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 border border-orange-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
            title="Swap this dish — app automatically replans future days"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <span>Swap Dish</span>
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
            <span>{isCooked ? 'Marked as Cooked ✓' : 'Cooked This!'}</span>
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
              <span>Dining out tonight? Tap here</span>
            </button>
          </div>
        )}
      </div>

      {/* 💡 Food Inspiration Section: Suggests items not in fridge so you never miss out on good food! */}
      {inspiration && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/70 rounded-xl p-2.5 border border-amber-300/70 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider">
                Craving Good Food? (Shop & Cook)
              </span>
            </div>
            {onShuffleInspiration && (
              <button
                type="button"
                onClick={onShuffleInspiration}
                className="text-[10px] font-black text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors"
                title="See another delicious recipe idea"
              >
                Shuffle 🎲
              </button>
            )}
          </div>

          <div className="bg-white/95 rounded-lg p-2.5 border border-amber-200/80 mb-2">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                {inspiration.recipe.name}
                {inspiration.recipe.hindiName && (
                  <span className="text-[11px] font-bold text-amber-800 ml-1">
                    ({inspiration.recipe.hindiName})
                  </span>
                )}
              </h4>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex-shrink-0">
                {inspiration.recipe.baseProteinGrams + inspiration.recipe.addedProteinGrams}g Protein
              </span>
            </div>

            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-1.5">
              {inspiration.recipe.description}
            </p>

            {inspiration.missingIngredients.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-1.5 border-t border-amber-100 text-[10px]">
                <span className="font-extrabold text-amber-900 flex items-center gap-0.5">
                  <ShoppingCart className="w-3 h-3 text-orange-600 inline" />
                  Need:
                </span>
                <span className="font-bold text-orange-800">
                  {inspiration.missingIngredients.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons for Inspiration: Cook this instead & Tell Partner */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectInspiration && onSelectInspiration(inspiration.recipe.id)}
              className="h-8 px-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-black shadow-2xs flex items-center justify-center gap-1 transition-all"
            >
              <span>Cook this instead 🍲</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareInspiration(inspiration.recipe, inspiration.missingIngredients)}
              className="h-8 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-2xs flex items-center justify-center gap-1 transition-all"
            >
              <MessageCircle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Tell Partner 💬</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
