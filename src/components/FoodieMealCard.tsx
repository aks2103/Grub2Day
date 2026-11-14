import React from 'react';
import { Check, RotateCcw, UtensilsCrossed, Clock, Dumbbell, Sparkles, Heart, MessageCircle } from 'lucide-react';
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
}

const SLOT_STYLES: Record<MealSlot, { title: string; emoji: string; accent: string; badge: string }> = {
  breakfast: {
    title: 'Breakfast (नाश्ता)',
    emoji: '🌅',
    accent: 'border-l-4 border-amber-400',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  lunch: {
    title: 'Lunch (दोपहर का खाना)',
    emoji: '☀️',
    accent: 'border-l-4 border-orange-500',
    badge: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  dinner: {
    title: 'Dinner (रात का खाना)',
    emoji: '🌙',
    accent: 'border-l-4 border-rose-500',
    badge: 'bg-rose-100 text-rose-900 border-rose-200',
  },
};

const REGION_BADGES: Record<string, { label: string; icon: string }> = {
  north: { label: 'North Indian', icon: '🏔️' },
  south: { label: 'South Indian', icon: '🌴' },
  west: { label: 'West Indian', icon: '🌊' },
  east: { label: 'East Indian', icon: '🌾' },
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
}) => {
  const meta = SLOT_STYLES[slot];

  const handleShareWithWife = () => {
    if (!recipe) return;
    let targetPhone = wifePhone || localStorage.getItem('wife_whatsapp_phone') || '';
    if (!targetPhone) {
      const entered = window.prompt(
        "Enter partner's 10-digit mobile number for 1-tap direct WhatsApp sharing:\n(e.g. 9876543210)\n\nTip: You can hide the WhatsApp button anytime in Pantry (🧊) settings.",
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
    const slotTitle = meta.title.split('(')[0].trim();
    const appUrl = window.location.origin;
    const text = encodeURIComponent(
      `Hey! Aaj ${slotTitle} mein *${mealName}* khane ka mann hai 😋❤️\n\nProtein Boost: ${recipe.husbandProteinBooster}\n\nCheck on Grub2Day: ${appUrl}`
    );
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  // Dining Out Card
  if (entry.isDiningOut) {
    return (
      <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/70 rounded-2xl border border-orange-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍕</span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800 block">
                {meta.title}
              </span>
              <h3 className="text-base font-black text-slate-900">
                Dining Out Tonight
              </h3>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-200/80 text-orange-950 border border-orange-300">
            Kitchen Off! ✨
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
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
          className="h-9 px-4 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-xs hover:bg-orange-600 active:scale-95 transition-all"
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
        ? 'border-emerald-300 bg-emerald-50/15 ring-2 ring-emerald-100 shadow-sm' 
        : 'border-orange-100/90 shadow-sm hover:border-orange-300'
    } p-4 sm:p-5 relative overflow-hidden`}>

      {/* Top Slot & Regional Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base">{meta.emoji}</span>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.badge}`}>
            {meta.title.split('(')[0].trim()}
          </span>
          {region && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <span>{region.icon}</span>
              <span>{region.label}</span>
            </span>
          )}
        </div>

        {/* Nutritional Pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
            <Dumbbell className="w-3 h-3 text-emerald-600" />
            {totalProtein}g Protein
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
            <Clock className="w-3 h-3" />
            {recipe.prepTimeMinutes}m
          </span>
        </div>
      </div>

      {/* Dish Name */}
      <div className="mb-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
          {recipe.name}
        </h3>
        {recipe.hindiName && (
          <span className="text-xs font-bold text-amber-700 block mt-0.5">
            {recipe.hindiName}
          </span>
        )}
      </div>

      {/* Appetizing Flavor Description */}
      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        {recipe.description}
      </p>

      {/* Family Swaad & Prep Note (Warm, Human, Kid & Protein Friendly) */}
      <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/60 mb-2.5 space-y-1.5 text-xs">
        <div className="flex items-start gap-1.5 leading-relaxed text-amber-950">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">For the Kids: </span>
            <span className="text-amber-800">{recipe.kidFriendlyTip}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 leading-relaxed text-slate-700 pt-1.5 border-t border-amber-200/50">
          <span className="font-bold text-slate-900 flex-shrink-0">Protein Boost: </span>
          <span className="text-slate-700">{recipe.husbandProteinBooster}</span>
        </div>
      </div>

      {/* Craving & Sharing Bar (Direct WhatsApp or Clean Craving-Only) */}
      {showWhatsAppShare ? (
        <div className="bg-gradient-to-r from-rose-50/80 to-amber-50/80 rounded-xl p-2 border border-rose-200/70 mb-3 flex items-center justify-between gap-2">
          <button
            onClick={() => onToggleCraving && onToggleCraving(!entry.isHusbandCraving)}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
              entry.isHusbandCraving
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
            title="Mark this as a craving today"
          >
            <Heart className={`w-3.5 h-3.5 ${entry.isHusbandCraving ? 'fill-white text-white' : 'text-rose-500'}`} />
            <span className="truncate">{entry.isHusbandCraving ? "Craving This ❤️" : 'Craving this?'}</span>
          </button>

          <button
            onClick={handleShareWithWife}
            className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            title="Send direct WhatsApp message to partner"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="truncate">Share Dish 💬</span>
          </button>
        </div>
      ) : (
        <div className="mb-3">
          <button
            onClick={() => onToggleCraving && onToggleCraving(!entry.isHusbandCraving)}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${
              entry.isHusbandCraving
                ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-200'
                : 'bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
            }`}
            title="Mark this as a craving today"
          >
            <Heart className={`w-4 h-4 ${entry.isHusbandCraving ? 'fill-white text-white' : 'text-rose-500'}`} />
            <span>{entry.isHusbandCraving ? "Marked as Craving Today ❤️" : 'Craving this dish today?'}</span>
          </button>
        </div>
      )}

      {/* Action Controls - Structured Mobile Grid (Never Wraps Awkwardly) */}
      <div className="pt-2.5 border-t border-slate-100 space-y-2">
        {/* Row 1: How to Cook + Swap (50/50 Balanced Grid) */}
        <div className="grid grid-cols-2 gap-2">
          {/* How to Cook Button (opens recipe details & YouTube video link) */}
          <button
            onClick={() => onOpenHowToCook(recipe)}
            className="h-10 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            title="View step-by-step instructions & YouTube recipe video"
          >
            <span>How to Cook 🍳</span>
          </button>

          {/* Swap Button */}
          <button
            onClick={onSwapClick}
            className="h-10 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 border border-orange-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            title="Swap this dish — app automatically replans future days"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
            <span>Swap Dish</span>
          </button>
        </div>

        {/* Row 2: Cooked Button (Full width hero button for Today) */}
        {dayIndex === 0 && (
          <button
            onClick={() => onMarkCooked(!isCooked)}
            className={`w-full h-10 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs ${
              isCooked
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isCooked ? 'Marked as Cooked ✓' : 'Cooked This!'}</span>
          </button>
        )}

        {/* Dinner Dining out toggle (Clean subtle centered bar) */}
        {slot === 'dinner' && onToggleDiningOut && (
          <div className="text-center pt-0.5">
            <button
              onClick={() => onToggleDiningOut(true)}
              className="text-[11px] font-bold text-slate-500 hover:text-orange-700 active:scale-95 transition-colors inline-flex items-center gap-1 px-2 py-0.5"
            >
              <UtensilsCrossed className="w-3 h-3 text-orange-500" />
              <span>Having non-veg outside? Tap for Dining Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
