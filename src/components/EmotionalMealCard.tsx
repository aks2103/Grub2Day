import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RotateCcw, CheckCircle2, Clock, Dumbbell, 
  Baby, UtensilsCrossed, MessageSquare 
} from 'lucide-react';
import { MealSlot, Recipe, MealSlotEntry } from '../types';
import { getEmotionalInsight, EmotionalCulinaryInsight } from '../services/geminiAiService';

interface EmotionalMealCardProps {
  slot: MealSlot;
  entry: MealSlotEntry;
  recipe?: Recipe | null;
  dayIndex: number; // 0 = today, 1..5 = future days
  onMarkCooked: (isCooked: boolean) => void;
  onSwapClick: () => void;
  onToggleProteinBooster: (hadBooster: boolean) => void;
  onToggleDiningOut?: (isDiningOut: boolean) => void;
  onAskGemini: (recipeName: string) => void;
}

const SLOT_META: Record<MealSlot, { title: string; emoji: string }> = {
  breakfast: { title: 'Breakfast (नाश्ता)', emoji: '🌅' },
  lunch: { title: 'Lunch (दोपहर का खाना)', emoji: '☀️' },
  dinner: { title: 'Dinner (रात का खाना)', emoji: '🌙' },
};

export const EmotionalMealCard: React.FC<EmotionalMealCardProps> = ({
  slot,
  entry,
  recipe,
  dayIndex,
  onMarkCooked,
  onSwapClick,
  onToggleProteinBooster,
  onToggleDiningOut,
  onAskGemini,
}) => {
  const meta = SLOT_META[slot];
  const [insight, setInsight] = useState<EmotionalCulinaryInsight | null>(null);

  useEffect(() => {
    if (recipe) {
      getEmotionalInsight(recipe, slot).then(setInsight);
    }
  }, [recipe, slot]);

  // Dining out state for dinner
  if (entry.isDiningOut) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍕</span>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 block">
                {meta.title}
              </span>
              <h3 className="text-sm font-extrabold text-slate-800">
                Dining Out Tonight (Restaurant Non-Veg)
              </h3>
            </div>
          </div>
          {onToggleDiningOut && (
            <button
              onClick={() => onToggleDiningOut(false)}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Cook at Home Instead
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 leading-relaxed">
          🍗 Alok enjoying non-veg outside. Wife has the evening free from heavy cooking! Quick and easy bites for the little ones.
        </p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
        <p className="text-xs text-slate-500 mb-2">No dish chosen for {meta.title}</p>
        <button
          onClick={onSwapClick}
          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl"
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
        ? 'border-emerald-300 ring-2 ring-emerald-50 shadow-xs' 
        : 'border-slate-200 shadow-xs hover:border-amber-300'
    } p-4 sm:p-5 relative`}>

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-start gap-2.5">
          <span className="text-xl p-2 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
            {meta.emoji}
          </span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {slot}
              </span>
              {recipe.region && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                  {recipe.region === 'north' && '🏔️ North'}
                  {recipe.region === 'south' && '🌴 South'}
                  {recipe.region === 'west' && '🌊 West'}
                  {recipe.region === 'east' && '🌾 East'}
                </span>
              )}
              {insight?.emotionalTag && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                  {insight.emotionalTag}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
              {recipe.name}
            </h3>
            {recipe.hindiName && (
              <span className="text-xs font-semibold text-amber-700 block">
                {recipe.hindiName}
              </span>
            )}
          </div>
        </div>

        {/* Nutritional Badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
            <Dumbbell className="w-3 h-3 text-emerald-600" />
            {totalProtein}g Protein
          </span>
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {recipe.prepTimeMinutes}m
          </span>
        </div>
      </div>

      {/* EMOTIONAL CULINARY INSIGHT: "Why this dish today?" */}
      <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/80 mb-3 space-y-1.5">
        <div className="flex items-start gap-1.5 text-xs text-amber-950 leading-relaxed">
          <span className="font-bold text-amber-800 flex-shrink-0">Why this today:</span>
          <span>{insight?.whyThis || recipe.description}</span>
        </div>

        {/* Chef's Loving Touch: "Try this..." */}
        <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-1.5 border-t border-amber-200/50 leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Chef's Little Touch: </span>
            <span className="text-slate-600">{insight?.tryThisTwist}</span>
          </div>
        </div>
      </div>

      {/* Gentle Tips: Kids & Alok's Protein */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5 text-xs">
        {/* Baby & Toddler Note */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
          <Baby className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700 block text-[11px]">For the Little Ones:</span>
            <span className="text-slate-500 leading-snug text-[11px]">{recipe.kidFriendlyTip}</span>
          </div>
        </div>

        {/* Alok's Protein Booster */}
        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex items-start justify-between gap-2">
          <div>
            <span className="font-bold text-emerald-900 block text-[11px]">Alok's Protein Booster:</span>
            <span className="text-emerald-700 leading-snug text-[11px]">{recipe.husbandProteinBooster}</span>
          </div>
          <button
            onClick={() => onToggleProteinBooster(!hadBooster)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
              hadBooster ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-300 text-emerald-700'
            }`}
          >
            {hadBooster ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {/* Swap Dish Button (triggers cascading re-plan of future days) */}
          <button
            onClick={onSwapClick}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Swap this dish — app will auto-replan future days to prevent repetition!"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Swap Dish</span>
          </button>

          {/* Ask Gemini Button */}
          <button
            onClick={() => onAskGemini(recipe.name)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors flex items-center gap-1"
            title="Ask Gemini for cooking tips, substitutes or pairings"
          >
            <MessageSquare className="w-3 h-3 text-amber-600" />
            <span>Ask Gemini</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Dinner Dining out toggle */}
          {slot === 'dinner' && onToggleDiningOut && (
            <button
              onClick={() => onToggleDiningOut(true)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50"
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>Dining Out</span>
            </button>
          )}

          {/* Mark Cooked Button */}
          {dayIndex === 0 && (
            <button
              onClick={() => onMarkCooked(!isCooked)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isCooked
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCooked ? 'Cooked' : 'Cooked This!'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
