import React, { useState } from 'react';
import { X, Search, Check, Sparkles, Dumbbell, Clock } from 'lucide-react';
import { Recipe, MealSlot } from '../types';

interface FoodieSwapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slot: MealSlot;
  currentRecipeName?: string;
  options: Recipe[];
  allAvailableRecipes: Recipe[];
  onSelectRecipe: (recipeId: string) => void;
}

export const FoodieSwapSheet: React.FC<FoodieSwapSheetProps> = ({
  isOpen,
  onClose,
  slot,
  currentRecipeName,
  options,
  allAvailableRecipes,
  onSelectRecipe,
}) => {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'north' | 'south' | 'west' | 'east'>('all');
  const [showAll, setShowAll] = useState(false);

  if (!isOpen) return null;

  const baseList = showAll || search.trim() !== '' ? allAvailableRecipes : options;

  const filtered = baseList.filter(r => {
    const matchesSearch = 
      search.trim() === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.hindiName && r.hindiName.includes(search)) ||
      r.mainIngredients.some(i => i.toLowerCase().includes(search.toLowerCase()));

    const matchesRegion = regionFilter === 'all' || r.region === regionFilter;

    return matchesSearch && matchesRegion;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden"
        role="dialog"
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-orange-100 flex items-center justify-between bg-orange-50/50">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🥘</span>
              <h3 className="font-black text-base text-slate-900 capitalize">
                Swap {slot} Dish
              </h3>
            </div>
            <p className="text-xs text-amber-800 font-semibold mt-0.5">
              Currently: {currentRecipeName || 'None'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-Day Zero Repeat Guarantee Banner */}
        <div className="bg-emerald-50 px-4 py-1.5 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-1 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Guaranteed Unique across Breakfast, Lunch, Dinner & 6 Days
          </span>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] underline font-extrabold text-emerald-900"
          >
            {showAll ? 'Show Top 5' : 'View All'}
          </button>
        </div>

        {/* Regional Filter Chips */}
        <div className="px-4 py-2 bg-white border-b border-orange-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All India 🇮🇳' },
            { id: 'north', label: '🏔️ North' },
            { id: 'south', label: '🌴 South' },
            { id: 'west', label: '🌊 West' },
            { id: 'east', label: '🌾 East' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => {
                setRegionFilter(r.id as any);
                if (!showAll && r.id !== 'all') setShowAll(true);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                regionFilter === r.id
                  ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                  : 'bg-orange-50/50 text-slate-700 border-orange-200/70 hover:bg-orange-100/70'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes or vegetables (e.g. paneer, dal, bhindi)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Recipe Cards List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching recipes found.
            </div>
          ) : (
            filtered.map(recipe => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => {
                  onSelectRecipe(recipe.id);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-2xl border border-orange-100/80 hover:border-orange-300 hover:bg-orange-50/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between shadow-2xs bg-white"
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900">
                      {recipe.name}
                    </h4>
                    {recipe.hindiName && (
                      <span className="text-[11px] font-bold text-amber-700">
                        ({recipe.hindiName})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {recipe.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-0.5 text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <Dumbbell className="w-3 h-3" />
                      {recipe.baseProteinGrams + recipe.addedProteinGrams}g Protein
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {recipe.prepTimeMinutes}m
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-black shadow-xs hover:bg-orange-600 transition-colors flex items-center gap-1 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  <span>Pick</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
