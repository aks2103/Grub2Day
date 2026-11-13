import React from 'react';
import { Check, RotateCcw, UtensilsCrossed, Clock, Dumbbell, Sparkles } from 'lucide-react';
import { MealSlot, Recipe, MealSlotEntry } from '../types';

interface FoodieMealCardProps {
  slot: MealSlot;
  entry: MealSlotEntry;
  recipe?: Recipe | null;
  dayIndex: number;
  onMarkCooked: (isCooked: boolean) => void;
  onSwapClick: () => void;
  onOpenHowToCook: (recipe: Recipe) => void;
  onToggleDiningOut?: (isDiningOut: boolean) => void;
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
  onToggleDiningOut,
}) => {
  const meta = SLOT_STYLES[slot];

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
          Alok enjoying non-veg outside. Wife has the evening free from heavy cooking! Quick and light bites for the little ones.
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
      <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/60 mb-3.5 space-y-1.5 text-xs">
        <div className="flex items-start gap-1.5 leading-relaxed text-amber-950">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">For the Kids: </span>
            <span className="text-amber-800">{recipe.kidFriendlyTip}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 leading-relaxed text-slate-700 pt-1.5 border-t border-amber-200/50">
          <span className="font-bold text-slate-900 flex-shrink-0">Alok's Protein: </span>
          <span className="text-slate-700">{recipe.husbandProteinBooster}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* How to Cook Button (opens recipe details & YouTube video link) */}
          <button
            onClick={() => onOpenHowToCook(recipe)}
            className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black transition-all flex items-center gap-1 shadow-2xs"
            title="View step-by-step instructions & YouTube recipe video"
          >
            <span>How to Cook 🍳</span>
          </button>

          {/* Swap Button */}
          <button
            onClick={onSwapClick}
            className="h-9 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 border border-orange-200/80 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
            title="Swap this dish — app automatically replans future days"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
            <span>Swap</span>
          </button>

          {/* Dinner Dining out toggle */}
          {slot === 'dinner' && onToggleDiningOut && (
            <button
              onClick={() => onToggleDiningOut(true)}
              className="h-9 px-2 rounded-xl text-slate-600 hover:text-orange-700 active:scale-95 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
              <span>Dining Out</span>
            </button>
          )}
        </div>

        {/* Cooked Button (active for Today) */}
        {dayIndex === 0 && (
          <button
            onClick={() => onMarkCooked(!isCooked)}
            className={`h-9 px-4 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-xs ${
              isCooked
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isCooked ? 'Cooked ✓' : 'Cooked This!'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
