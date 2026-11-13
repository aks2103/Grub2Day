import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { Recipe, MealSlot } from '../types';

interface IOSSwapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slot: MealSlot;
  currentRecipeName?: string;
  options: Recipe[];
  allAvailableRecipes: Recipe[];
  onSelectRecipe: (recipeId: string) => void;
}

export const IOSSwapSheet: React.FC<IOSSwapSheetProps> = ({
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden"
        role="dialog"
      >
        {/* iOS Grabber Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto mt-2.5 mb-1" />

        {/* Sheet Navigation Header */}
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">
              Choose {slot.charAt(0).toUpperCase() + slot.slice(1)}
            </h3>
            <p className="text-xs text-neutral-400">
              Currently: {currentRecipeName || 'None'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Region Filter Chips */}
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'north', label: 'North' },
            { id: 'south', label: 'South' },
            { id: 'west', label: 'West' },
            { id: 'east', label: 'East' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => {
                setRegionFilter(r.id as any);
                if (!showAll && r.id !== 'all') setShowAll(true);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                regionFilter === r.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Native iOS Search Bar */}
        <div className="p-3 border-b border-neutral-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by ingredient or dish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-100 border-none focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        {/* Options List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No matching recipes found.
            </div>
          ) : (
            filtered.map(recipe => (
              <div
                key={recipe.id}
                onClick={() => {
                  onSelectRecipe(recipe.id);
                  onClose();
                }}
                className="p-3 rounded-xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">
                    {recipe.name}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {recipe.prepTimeMinutes}m • {recipe.baseProteinGrams + recipe.addedProteinGrams}g protein
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
