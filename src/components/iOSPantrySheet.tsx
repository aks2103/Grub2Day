import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { PantryState } from '../types';
import { STANDARD_VEGGIES, STANDARD_STAPLES } from '../services/pantryService';

interface IOSPantrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryState;
  onUpdatePantry: (updated: PantryState) => Promise<void>;
  onApply: () => void;
}

export const IOSPantrySheet: React.FC<IOSPantrySheetProps> = ({
  isOpen,
  onClose,
  pantry,
  onUpdatePantry,
  onApply,
}) => {
  const [veggies, setVeggies] = useState<Set<string>>(new Set(pantry.availableVeggies));
  const [staples, setStaples] = useState<Set<string>>(new Set(pantry.staplesInStock));

  if (!isOpen) return null;

  const toggleVeggie = async (id: string) => {
    const next = new Set(veggies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVeggies(next);
    await onUpdatePantry({
      ...pantry,
      availableVeggies: Array.from(next),
      lastUpdated: new Date().toISOString(),
    });
  };

  const toggleStaple = async (id: string) => {
    const next = new Set(staples);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setStaples(next);
    await onUpdatePantry({
      ...pantry,
      staplesInStock: Array.from(next),
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden"
        role="dialog"
      >
        {/* iOS Grabber Handle */}
        <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto mt-2.5 mb-1" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">
              Kitchen & Fridge
            </h3>
            <p className="text-xs text-neutral-400">
              Select what you currently have in stock
            </p>
          </div>
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Veggies */}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block mb-2">
              Fresh Vegetables & Dairy
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {STANDARD_VEGGIES.map(v => {
                const checked = veggies.has(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVeggie(v.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-100 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="truncate">{v.label.split('(')[0].trim()}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staples */}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block mb-2">
              Dals & Legumes
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {STANDARD_STAPLES.map(s => {
                const checked = staples.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStaple(s.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-100 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
