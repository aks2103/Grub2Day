import React, { useState } from 'react';
import { Check, Plus, Sparkles } from 'lucide-react';
import { PantryState } from '../types';
import { STANDARD_VEGGIES, STANDARD_STAPLES } from '../services/pantryService';

interface PantryViewProps {
  pantry: PantryState;
  onUpdatePantry: (updated: PantryState) => Promise<void>;
  onRegenerateWithPantry: () => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  pantry,
  onUpdatePantry,
  onRegenerateWithPantry,
}) => {
  const [selectedVeggies, setSelectedVeggies] = useState<Set<string>>(
    new Set(pantry.availableVeggies)
  );
  const [selectedStaples, setSelectedStaples] = useState<Set<string>>(
    new Set(pantry.staplesInStock)
  );
  const [customInput, setCustomInput] = useState('');

  const toggleVeggie = async (id: string) => {
    const updated = new Set(selectedVeggies);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedVeggies(updated);
    await saveChanges(updated, selectedStaples);
  };

  const toggleStaple = async (id: string) => {
    const updated = new Set(selectedStaples);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedStaples(updated);
    await saveChanges(selectedVeggies, updated);
  };

  const saveChanges = async (veggies: Set<string>, staples: Set<string>) => {
    const newPantry: PantryState = {
      ...pantry,
      availableVeggies: Array.from(veggies),
      staplesInStock: Array.from(staples),
      lastUpdated: new Date().toISOString(),
    };
    await onUpdatePantry(newPantry);
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim().toLowerCase().replace(/\s+/g, '_');
    const updated = new Set(selectedVeggies);
    updated.add(clean);
    setSelectedVeggies(updated);
    setCustomInput('');
    await saveChanges(updated, selectedStaples);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Intro Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧊</span>
            <h2 className="font-extrabold text-base text-slate-900">
              What's in your Fridge & Pantry today?
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Tap the vegetables and staples you currently have in stock. The app automatically prioritizes recipes that use what you already have at home!
          </p>
        </div>
        <button
          onClick={onRegenerateWithPantry}
          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply to Menu</span>
        </button>
      </div>

      {/* Fresh Vegetables Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <span>🥬</span>
            <span>Fresh Vegetables & Dairy (सब्ज़ियाँ)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {selectedVeggies.size} Selected
          </span>
        </div>

        {/* Veggie Chips Grid */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STANDARD_VEGGIES.map(item => {
            const isSelected = selectedVeggies.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleVeggie(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Add Custom Ingredient Form */}
        <form onSubmit={handleAddCustom} className="flex gap-2 pt-3 border-t border-slate-100">
          <input
            type="text"
            placeholder="Add any other veggie (e.g. sweet_corn, mushroom, drumstick)..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Dals & Dry Staples Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <span>🌾</span>
            <span>Dals, Legumes & Kitchen Staples (दालें व राशन)</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {selectedStaples.size} In Stock
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STANDARD_STAPLES.map(item => {
            const isSelected = selectedStaples.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleStaple(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
