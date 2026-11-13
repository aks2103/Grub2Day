import React from 'react';
import { Check, RotateCcw, UtensilsCrossed } from 'lucide-react';
import { MealSlot, Recipe, MealSlotEntry } from '../types';

interface IOSMealCardProps {
  slot: MealSlot;
  entry: MealSlotEntry;
  recipe?: Recipe | null;
  dayIndex: number;
  onMarkCooked: (isCooked: boolean) => void;
  onSwapClick: () => void;
  onToggleDiningOut?: (isDiningOut: boolean) => void;
}

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
};

const REGION_LABELS: Record<string, string> = {
  north: 'North Indian',
  south: 'South Indian',
  west: 'West Indian',
  east: 'East Indian',
};

export const IOSMealCard: React.FC<IOSMealCardProps> = ({
  slot,
  entry,
  recipe,
  dayIndex,
  onMarkCooked,
  onSwapClick,
  onToggleDiningOut,
}) => {
  const slotName = SLOT_LABELS[slot];

  // Dining Out state
  if (entry.isDiningOut) {
    return (
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
            {slotName}
          </span>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
            Dining Out
          </span>
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-1">
          Dinner Outside (Restaurant Non-Veg)
        </h3>
        <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
          Alok having dinner outside. Home kitchen is off for tonight — quick and light meal for the little ones!
        </p>
        {onToggleDiningOut && (
          <button
            onClick={() => onToggleDiningOut(false)}
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 underline"
          >
            Switch to home cooking
          </button>
        )}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200/80 p-4 text-center">
        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase block mb-1">
          {slotName}
        </span>
        <p className="text-xs text-neutral-500 mb-2">No dish selected</p>
        <button
          onClick={onSwapClick}
          className="h-9 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
        >
          Select Meal
        </button>
      </div>
    );
  }

  const isCooked = entry.isCooked;
  const regionName = recipe.region ? REGION_LABELS[recipe.region] || 'Indian' : 'Indian';
  const totalProtein = recipe.baseProteinGrams + recipe.addedProteinGrams;

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isCooked 
        ? 'border-emerald-300 bg-emerald-50/10 shadow-xs' 
        : 'border-neutral-200/90 shadow-2xs hover:border-neutral-300'
    } p-4.5`}>
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
          {slotName}
        </span>
        <span className="text-xs font-semibold text-neutral-500">
          {regionName} • {recipe.prepTimeMinutes}m • {totalProtein}g protein
        </span>
      </div>

      {/* Dish Name */}
      <div className="mb-2.5">
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight leading-snug">
          {recipe.name}
        </h3>
        {recipe.hindiName && (
          <span className="text-xs font-medium text-neutral-400 block mt-0.5">
            {recipe.hindiName}
          </span>
        )}
      </div>

      {/* Human Kitchen & Care Notes (Integrated, Non-AI feel) */}
      <div className="bg-neutral-50/90 rounded-xl p-3 border border-neutral-100 space-y-2 mb-3.5 text-xs text-neutral-600 leading-relaxed">
        <p className="text-neutral-700">
          {recipe.description}
        </p>
        <div className="pt-2 border-t border-neutral-200/60 flex flex-col gap-1 text-[11px]">
          <div>
            <span className="font-semibold text-neutral-800">For kids: </span>
            <span className="text-neutral-500">{recipe.kidFriendlyTip}</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-800">Alok's protein: </span>
            <span className="text-neutral-500">{recipe.husbandProteinBooster}</span>
          </div>
        </div>
      </div>

      {/* Native iOS Touch Action Buttons (Min 40px height for thumb tapping) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          {/* Swap Button */}
          <button
            onClick={onSwapClick}
            className="h-9 px-3.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-95 text-neutral-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Swap this dish"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Swap</span>
          </button>

          {/* Dinner specific: Dining out link */}
          {slot === 'dinner' && onToggleDiningOut && (
            <button
              onClick={() => onToggleDiningOut(true)}
              className="h-9 px-2.5 rounded-xl text-neutral-500 hover:text-neutral-800 active:scale-95 text-xs font-medium transition-colors flex items-center gap-1"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Dining Out?</span>
            </button>
          )}
        </div>

        {/* Cooked Toggle Button (Only active for today) */}
        {dayIndex === 0 && (
          <button
            onClick={() => onMarkCooked(!isCooked)}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
              isCooked
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isCooked ? 'Cooked' : 'Mark Cooked'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
