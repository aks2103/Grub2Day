import React from 'react';
import { 
  Clock, Flame, Dumbbell, Baby, CheckCircle2, RotateCcw, 
  UtensilsCrossed, Sparkles 
} from 'lucide-react';
import { MealSlot, Recipe, MealSlotEntry } from '../types';

interface MealSlotCardProps {
  slot: MealSlot;
  entry: MealSlotEntry;
  recipe?: Recipe | null;
  onMarkCooked: (isCooked: boolean) => void;
  onSwapClick: () => void;
  onToggleProteinBooster: (hadBooster: boolean) => void;
  onToggleDiningOut?: (isDiningOut: boolean) => void;
}

const SLOT_META: Record<MealSlot, { title: string; emoji: string; subtitle: string; color: string }> = {
  breakfast: {
    title: 'Breakfast (नाश्ता)',
    emoji: '🌅',
    subtitle: 'Morning Energy & High Protein',
    color: 'border-amber-200 bg-amber-50/40 text-amber-900',
  },
  lunch: {
    title: 'Lunch (दोपहर का खाना)',
    emoji: '☀️',
    subtitle: 'Wholesome Dal, Sabzi & Roti/Rice',
    color: 'border-orange-200 bg-orange-50/40 text-orange-900',
  },
  dinner: {
    title: 'Dinner (रात का खाना)',
    emoji: '🌙',
    subtitle: 'Comforting & Recomp Friendly',
    color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
  },
};

export const MealSlotCard: React.FC<MealSlotCardProps> = ({
  slot,
  entry,
  recipe,
  onMarkCooked,
  onSwapClick,
  onToggleProteinBooster,
  onToggleDiningOut,
}) => {
  const meta = SLOT_META[slot];

  // If user marked Dining Out for dinner
  if (entry.isDiningOut) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍕</span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{meta.title}</h3>
              <p className="text-xs text-amber-700 font-medium">Dining Out Tonight (Restaurant / Non-Veg)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Wife's Kitchen Off! ✨
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-4 bg-amber-50 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
          🍗 Alok having non-veg dinner outside. Home kitchen cooking paused for tonight. Wife & kids can have something super quick & light!
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Estimated: ~35g Protein • ~650 kcal</span>
          {onToggleDiningOut && (
            <button
              onClick={() => onToggleDiningOut(false)}
              className="text-amber-600 hover:text-amber-700 font-bold underline text-xs"
            >
              Cancel Dining Out (Cook at Home)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
        <p className="text-sm font-semibold text-slate-600 mb-2">No meal selected for {meta.title}</p>
        <button
          onClick={onSwapClick}
          className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-amber-600 transition-colors"
        >
          Pick a Dish
        </button>
      </div>
    );
  }

  const isCooked = entry.isCooked;
  const hadBooster = entry.husbandHadProteinBooster ?? true;
  const totalProtein = recipe.baseProteinGrams + (hadBooster ? recipe.addedProteinGrams : 0);

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isCooked 
        ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md' 
        : 'border-slate-200 shadow-sm hover:border-amber-300'
    } p-4 sm:p-5 relative overflow-hidden`}>
      {/* Cooked Status Watermark Ribbon */}
      {isCooked && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-0.5 rounded-bl-xl text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-sm">
          <CheckCircle2 className="w-3 h-3" />
          Cooked • Cooldown Active
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl p-2 bg-slate-50 rounded-xl border border-slate-100">
            {meta.emoji}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {slot}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-medium text-slate-500">
                {meta.subtitle}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {recipe.name}
            </h3>
            {recipe.hindiName && (
              <span className="text-xs text-amber-700 font-semibold">
                {recipe.hindiName}
              </span>
            )}
          </div>
        </div>

        {/* Nutritional Pills */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
            <Dumbbell className="w-3 h-3 text-emerald-600" />
            {totalProtein}g Protein
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Flame className="w-3 h-3 text-orange-500" />
            {recipe.baseCalories} kcal
            <span className="text-slate-300">|</span>
            <Clock className="w-3 h-3 text-slate-400" />
            {recipe.prepTimeMinutes}m
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        {recipe.description}
      </p>

      {/* Kid / Toddler Friendly Tip Box */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 mb-3 flex items-start gap-2">
        <div className="p-1 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
          <Baby className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-amber-900">Kids & Toddler Prep Tip: </span>
          <span className="text-amber-800">{recipe.kidFriendlyTip}</span>
        </div>
      </div>

      {/* Husband Protein Booster Card (For Recomp 36M 78kg) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 text-xs">
          <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800 flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-800">Alok's Protein Booster:</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                +{recipe.addedProteinGrams}g
              </span>
            </div>
            <p className="text-slate-600 mt-0.5 leading-snug">
              {recipe.husbandProteinBooster}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleProteinBooster(!hadBooster)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
            hadBooster
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle whether you had this protein addition"
        >
          {hadBooster ? '✓ Added' : '+ Add'}
        </button>
      </div>

      {/* Action Buttons for Wife / Family */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {/* Mark Cooked Button */}
          <button
            onClick={() => onMarkCooked(!isCooked)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isCooked
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCooked ? 'Marked Cooked' : 'Cooked This!'}</span>
          </button>

          {/* Swap Dish Button */}
          <button
            onClick={onSwapClick}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Swap this dish with alternative options that respect 6-day cooldown"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Swap Dish</span>
          </button>
        </div>

        {/* Dinner specific: Dining Out Toggle */}
        {slot === 'dinner' && onToggleDiningOut && (
          <button
            onClick={() => onToggleDiningOut(true)}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-1"
            title="Having non-veg outside tonight? Skip home cooking!"
          >
            <UtensilsCrossed className="w-3 h-3" />
            <span>Dining Out?</span>
          </button>
        )}
      </div>
    </div>
  );
};
