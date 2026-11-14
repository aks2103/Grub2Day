import React, { useState } from 'react';
import { X, Search, Check, Dumbbell, Clock } from 'lucide-react';
import { Recipe, MealSlot, PantryState } from '../types';
import { getMissingIngredientsForRecipe, hasRequiredCoreIngredients } from '../services/pantryService';
import { TRANSLATIONS } from '../i18n/translations';
import { getLocalizedRecipe } from '../i18n/recipeLocalization';

interface FoodieSwapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slot: MealSlot;
  currentRecipeName?: string;
  options: Recipe[];
  allAvailableRecipes: Recipe[];
  onSelectRecipe: (recipeId: string) => void;
  pantry?: PantryState | null;
  language?: 'en' | 'hi';
}

export const FoodieSwapSheet: React.FC<FoodieSwapSheetProps> = ({
  isOpen,
  onClose,
  slot,
  currentRecipeName,
  options,
  allAvailableRecipes,
  onSelectRecipe,
  pantry,
  language = 'en',
}) => {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'north' | 'south' | 'west' | 'east' | 'chinese' | 'street_food'>('all');
  const [showAll, setShowAll] = useState(false);
  const [inspirationFilter, setInspirationFilter] = useState<'all' | 'fridge' | 'inspiration'>('all');

  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  let baseList = showAll || search.trim() !== '' ? allAvailableRecipes : options;

  if (pantry) {
    if (inspirationFilter === 'fridge') {
      baseList = allAvailableRecipes.filter(r => hasRequiredCoreIngredients(r, pantry));
    } else if (inspirationFilter === 'inspiration') {
      baseList = allAvailableRecipes.filter(r => !hasRequiredCoreIngredients(r, pantry));
    }
  }

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md sm:max-w-xl md:max-w-2xl rounded-t-[28px] sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden"
        role="dialog"
      >
        {/* Grab Handle (Mobile) */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 sm:hidden" />

        {/* Header: Title + Current Recipe + Close Button */}
        <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between bg-orange-50/60">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🥘</span>
              <h3 className="font-black text-base text-slate-900 capitalize truncate">
                {t.swapSheetTitle(t[slot])}
              </h3>
            </div>
            <p className="text-[11px] text-amber-800 font-bold truncate mt-0.5">
              {t.currently}: <span className="text-slate-900 font-extrabold">{currentRecipeName || 'None'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-2xs flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Compact Search & Filters Panel */}
        <div className="p-3 bg-amber-50/40 border-b border-orange-100 space-y-2">
          {/* Row 1: Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-orange-200/80 focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-medium text-slate-900"
            />
          </div>

          {/* Row 2: Source Tabs + Region Filter (Clean & Responsive) */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Source Toggle */}
            {pantry && (
              <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-orange-200/80 shadow-2xs">
                <button
                  onClick={() => { setInspirationFilter('all'); setShowAll(true); }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
                    inspirationFilter === 'all'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.allOptions} ({allAvailableRecipes.length})
                </button>
                <button
                  onClick={() => { setInspirationFilter('fridge'); setShowAll(true); }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 ${
                    inspirationFilter === 'fridge'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🧊</span>
                  <span>{t.inFridge}</span>
                </button>
                <button
                  onClick={() => { setInspirationFilter('inspiration'); setShowAll(true); }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 ${
                    inspirationFilter === 'inspiration'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>💡</span>
                  <span>{t.foodInspiration}</span>
                </button>
              </div>
            )}

            {/* Region Chips (Flex-Wrap - Never cut off on any device) */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: t.allIndia },
                { id: 'north', label: t.north },
                { id: 'south', label: t.south },
                { id: 'west', label: t.west },
                { id: 'east', label: t.east },
                { id: 'chinese', label: `🥢 ${t.chinese}` },
                { id: 'street_food', label: `🍢 ${t.streetFood}` },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRegionFilter(r.id as any);
                    if (!showAll && r.id !== 'all') setShowAll(true);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors border ${
                    regionFilter === r.id
                      ? 'bg-orange-500 text-white border-orange-500 shadow-2xs font-black'
                      : 'bg-white text-slate-700 border-orange-200/70 hover:bg-orange-100/70'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipe Cards List */}
        <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {t.noRecipesFound}
            </div>
          ) : (
            filtered.map(recipe => {
              const loc = getLocalizedRecipe(recipe, language);
              const displayName = loc.name;
              const missing = pantry ? getMissingIngredientsForRecipe(recipe, pantry, language) : [];

              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => {
                    onSelectRecipe(recipe.id);
                    onClose();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl border border-orange-100 hover:border-orange-300 hover:bg-orange-50/40 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between shadow-2xs bg-white gap-2.5"
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {displayName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {loc.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-0.5 text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        <Dumbbell className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span>{recipe.baseProteinGrams + recipe.addedProteinGrams}{t.proteinUnit}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-orange-900 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                        <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
                        <span>{recipe.prepTimeMinutes || 20} {t.minsUnit}</span>
                      </span>
                      {pantry && (
                        hasRequiredCoreIngredients(recipe, pantry) ? (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-300">
                            🧊 {t.inFridge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-300">
                            💡 {t.needToGet}: {missing.slice(0, 2).join(', ')}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-orange-500 text-white text-xs font-black shadow-xs hover:bg-orange-600 transition-colors flex items-center gap-1 flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.pickDish}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
