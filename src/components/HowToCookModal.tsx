import React from 'react';
import { X, Play, Clock, Dumbbell, Sparkles, ChefHat, CheckCircle2 } from 'lucide-react';
import { Recipe } from '../types';
import { getCookingDetails } from '../services/cookingInstructionsService';

interface HowToCookModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe?: Recipe | null;
}

export const HowToCookModal: React.FC<HowToCookModalProps> = ({
  isOpen,
  onClose,
  recipe,
}) => {
  if (!isOpen || !recipe) return null;

  const details = getCookingDetails(recipe);
  const totalProtein = recipe.baseProteinGrams + recipe.addedProteinGrams;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[88vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden"
        role="dialog"
      >
        {/* iOS Grabber Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-orange-100 flex items-center justify-between bg-orange-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-snug">
                How to Cook
              </h3>
              <p className="text-xs text-amber-800 font-bold">
                {recipe.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Recipe Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick Specs Pill Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/50 border border-orange-200/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                {recipe.prepTimeMinutes} mins
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-800">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                {totalProtein}g Protein
              </span>
            </div>
            {recipe.hindiName && (
              <span className="font-bold text-amber-800 text-xs">
                {recipe.hindiName}
              </span>
            )}
          </div>

          {/* WATCH ON YOUTUBE BUTTON (Opens YouTube App on iPhone) */}
          <a
            href={details.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-red-600/30 transition-all text-xs"
          >
            <div className="w-6 h-6 rounded-full bg-white text-red-600 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-red-600 ml-0.5" />
            </div>
            <span>Watch Recipe Video on YouTube 📺</span>
          </a>

          {/* Ingredients Section */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-2">
              Key Ingredients
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {details.ingredients.map((ing, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-orange-50/70 border border-orange-200/60 text-slate-800 text-[11px] font-bold"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Step-by-Step Cooking Guide */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-2">
              Step-by-Step Instructions
            </h4>
            <div className="space-y-2">
              {details.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5 leading-relaxed text-slate-700"
                >
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kids & Protein Care Tips */}
          <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-200/60 space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block text-[11px]">For the Toddler:</span>
                <span className="text-amber-800 text-[11px] leading-snug">{recipe.kidFriendlyTip}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-amber-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950 block text-[11px]">Alok's Protein Booster:</span>
                <span className="text-emerald-800 text-[11px] leading-snug">{recipe.husbandProteinBooster}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
