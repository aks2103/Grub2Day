import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { PantryState } from '../types';
import { STANDARD_VEGGIES, STANDARD_STAPLES } from '../services/pantryService';

interface FoodiePantrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryState;
  onUpdatePantry: (updated: PantryState) => Promise<void>;
  onApply: () => void;
  wifePhone?: string;
  onUpdateWifePhone?: (phone: string) => void;
  showWhatsAppShare?: boolean;
  onToggleWhatsAppShare?: (show: boolean) => void;
}

export const FoodiePantrySheet: React.FC<FoodiePantrySheetProps> = ({
  isOpen,
  onClose,
  pantry,
  onUpdatePantry,
  onApply,
  wifePhone = '',
  onUpdateWifePhone,
  showWhatsAppShare = true,
  onToggleWhatsAppShare,
}) => {
  const [veggies, setVeggies] = useState<Set<string>>(new Set(pantry.availableVeggies));
  const [staples, setStaples] = useState<Set<string>>(new Set(pantry.staplesInStock));
  const [phoneInput, setPhoneInput] = useState<string>(() => {
    // Strip leading 91 for easier 10-digit editing if present
    const raw = wifePhone || localStorage.getItem('wife_whatsapp_phone') || '';
    return raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSavePhone = () => {
    let cleaned = phoneInput.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    localStorage.setItem('wife_whatsapp_phone', cleaned);
    if (onUpdateWifePhone) {
      onUpdateWifePhone(cleaned);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

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
              <span className="text-base">🧊</span>
              <h3 className="font-black text-base text-slate-900">
                What's in the Kitchen & Fridge?
              </h3>
            </div>
            <p className="text-xs text-amber-800 font-semibold mt-0.5">
              Tap what you have; the menu prioritizes recipes using your ingredients
            </p>
          </div>
          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-xs transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Grid of Groceries & Settings */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* Wife's WhatsApp & Craving Option */}
          <div className="bg-gradient-to-r from-rose-50/80 to-amber-50/60 rounded-2xl border border-rose-200/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    Direct WhatsApp to Wife
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Send cravings directly into her WhatsApp chat
                  </p>
                </div>
              </div>
              {onToggleWhatsAppShare && (
                <button
                  onClick={() => onToggleWhatsAppShare(!showWhatsAppShare)}
                  className={`text-[11px] font-black px-2.5 py-1 rounded-full border transition-all ${
                    showWhatsAppShare
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  {showWhatsAppShare ? 'Enabled ✓' : 'Hidden (Craving Only)'}
                </button>
              )}
            </div>

            {showWhatsAppShare ? (
              <div className="space-y-1.5 pt-1 border-t border-rose-200/50">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Wife's 10-digit Mobile Number:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full h-9 pl-10 pr-3 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <button
                    onClick={handleSavePhone}
                    className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition-all shadow-2xs flex-shrink-0"
                  >
                    {savedSuccess ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  When set, tapping "Tell Wifey" on any meal card opens her chat directly in WhatsApp.
                </p>
              </div>
            ) : (
              <div className="pt-1 border-t border-rose-200/50">
                <p className="text-[11px] text-rose-900 font-semibold bg-white/70 p-2 rounded-xl border border-rose-200/50">
                  ✨ WhatsApp button is removed from all cards. You will only see the clean <strong>Alok's Craving ❤️</strong> button!
                </p>
              </div>
            )}
          </div>

          {/* Fresh Vegetables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span>🥬</span>
                <span>Fresh Vegetables & Dairy</span>
              </span>
              <span className="text-[11px] font-bold text-orange-600">
                {veggies.size} Selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STANDARD_VEGGIES.map(v => {
                const checked = veggies.has(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVeggie(v.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-bold flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                        : 'bg-orange-50/30 text-slate-700 border-orange-200/60 hover:bg-orange-100/50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{v.icon}</span>
                      <span className="truncate">{v.label.split('(')[0].trim()}</span>
                    </span>
                    {checked && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dals & Staples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span>🌾</span>
                <span>Dals, Legumes & Staples</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-600">
                {staples.size} In Stock
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STANDARD_STAPLES.map(s => {
                const checked = staples.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStaple(s.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-bold flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-emerald-50/30 text-slate-700 border-emerald-200/60 hover:bg-emerald-100/50'
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
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
