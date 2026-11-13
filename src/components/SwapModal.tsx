import React, { useState } from 'react';
import { X, RotateCcw, Dumbbell, Clock, Flame, Check, Search, Sparkles } from 'lucide-react';
import { Recipe, MealSlot } from '../types';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: MealSlot;
  currentRecipeName?: string;
  options: Recipe[];
  allAvailableRecipes: Recipe[];
  onSelectRecipe: (recipeId: string) => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  slot,
  currentRecipeName,
  options,
  allAvailableRecipes,
  onSelectRecipe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  if (!isOpen) return null;

  const displayList = showAll || searchQuery.trim() !== ''
    ? allAvailableRecipes.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.hindiName && r.hindiName.includes(searchQuery)) ||
        r.mainIngredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Swap {slot.toUpperCase()} Dish
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Currently: <span className="font-semibold text-slate-700">{currentRecipeName || 'None'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guarantees banner */}
        <div className="bg-emerald-50 px-5 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Guaranteed Unique: No repeats across Breakfast, Lunch, Dinner or 6 days
          </span>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] underline font-bold text-emerald-900"
          >
            {showAll ? 'Show Top 5' : 'View All'}
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vegetable or dish (e.g. bhindi, dal, paneer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Options List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {displayList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching recipes found. Try a different search!
            </div>
          ) : (
            displayList.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
                  onSelectRecipe(recipe.id);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700">
                      {recipe.name}
                    </h4>
                    {recipe.hindiName && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({recipe.hindiName})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {recipe.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <Dumbbell className="w-3 h-3" />
                      {recipe.baseProteinGrams + recipe.addedProteinGrams}g Protein
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {recipe.baseCalories} kcal
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {recipe.prepTimeMinutes}m
                    </span>
                  </div>
                </div>

                <button 
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs group-hover:bg-amber-600 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Pick
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
