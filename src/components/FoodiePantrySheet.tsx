// ==============================================================================
// Grub2Day — Clean Kitchen & Fridge Sheet
// Minimalist, uncluttered UI: Show-as-you-type search + custom item creation with auto-labels
// ==============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Plus, Sparkles, Check, Trash2 } from 'lucide-react';
import { PantryState } from '../types';
import { 
  STANDARD_VEGGIES, 
  STANDARD_STAPLES, 
  PantryItemMeta, 
  getCustomPantryItems, 
  saveCustomPantryItem, 
  inferIconAndHindi
} from '../services/pantryService';
import { TRANSLATIONS } from '../i18n/translations';

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
  language?: 'en' | 'hi';
}



export const FoodiePantrySheet: React.FC<FoodiePantrySheetProps> = ({
  isOpen,
  onClose,
  pantry,
  onUpdatePantry,
  onApply,
  language = 'en',
}) => {
  const [veggies, setVeggies] = useState<Set<string>>(new Set(pantry.availableVeggies));
  const [staples, setStaples] = useState<Set<string>>(new Set(pantry.staplesInStock));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customItems, setCustomItems] = useState<PantryItemMeta[]>(() => getCustomPantryItems());

  const t = TRANSLATIONS[language];

  // Sync state whenever pantry or sheet visibility changes
  useEffect(() => {
    setVeggies(new Set(pantry.availableVeggies));
    setStaples(new Set(pantry.staplesInStock));
    setCustomItems(getCustomPantryItems());
  }, [pantry, isOpen]);

  // Combined library of all known items (Standard Veggies + Standard Staples + Custom Labels)
  const allLibraryItems = useMemo<PantryItemMeta[]>(() => {
    const map = new Map<string, PantryItemMeta>();
    STANDARD_VEGGIES.forEach(v => map.set(v.id, v));
    STANDARD_STAPLES.forEach(s => map.set(s.id, s));
    customItems.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  }, [customItems]);

  if (!isOpen) return null;

  // Selected items list with metadata
  const selectedItemsList = useMemo(() => {
    const list: PantryItemMeta[] = [];
    const allSelectedIds = new Set([...Array.from(veggies), ...Array.from(staples)]);

    allSelectedIds.forEach(id => {
      const found = allLibraryItems.find(item => item.id.toLowerCase() === id.toLowerCase());
      if (found) {
        list.push(found);
      } else {
        const inferred = inferIconAndHindi(id);
        list.push({
          id,
          label: inferred.nameEn,
          nameEn: inferred.nameEn,
          nameHi: inferred.nameHi,
          icon: inferred.icon,
        });
      }
    });

    return list;
  }, [veggies, staples, allLibraryItems]);

  // "Show as you type" matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return allLibraryItems.filter(item => {
      const matchEn = item.nameEn.toLowerCase().includes(q);
      const matchHi = item.nameHi && item.nameHi.includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      return matchEn || matchHi || matchId;
    });
  }, [searchQuery, allLibraryItems]);

  // Handle adding an item to the fridge
  const handleAddItem = async (item: PantryItemMeta) => {
    const isStaple = STANDARD_STAPLES.some(s => s.id.toLowerCase() === item.id.toLowerCase()) || 
      item.label.toLowerCase().includes('dal') || 
      item.label.toLowerCase().includes('flour') || 
      item.label.toLowerCase().includes('atta') || 
      item.label.toLowerCase().includes('rice');

    if (isStaple) {
      const next = new Set(staples);
      next.add(item.id);
      setStaples(next);
      await onUpdatePantry({
        ...pantry,
        staplesInStock: Array.from(next),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const next = new Set(veggies);
      next.add(item.id);
      setVeggies(next);
      await onUpdatePantry({
        ...pantry,
        availableVeggies: Array.from(next),
        lastUpdated: new Date().toISOString(),
      });
    }

    setSearchQuery('');
  };

  // Handle removing an item from the fridge
  const handleRemoveItem = async (id: string) => {
    const nextVeg = new Set(veggies);
    const nextStaple = new Set(staples);

    if (nextVeg.has(id)) nextVeg.delete(id);
    if (nextStaple.has(id)) nextStaple.delete(id);

    setVeggies(nextVeg);
    setStaples(nextStaple);

    await onUpdatePantry({
      ...pantry,
      availableVeggies: Array.from(nextVeg),
      staplesInStock: Array.from(nextStaple),
      lastUpdated: new Date().toISOString(),
    });
  };

  // Handle clearing all items
  const handleClearAll = async () => {
    setVeggies(new Set());
    setStaples(new Set());
    await onUpdatePantry({
      ...pantry,
      availableVeggies: [],
      staplesInStock: [],
      lastUpdated: new Date().toISOString(),
    });
  };

  // Handle adding custom item typed by user
  const handleAddCustom = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    // Check if it already matches an existing library item
    const existing = allLibraryItems.find(
      i => i.nameEn.toLowerCase() === query.toLowerCase() || (i.nameHi && i.nameHi.includes(query))
    );

    if (existing) {
      await handleAddItem(existing);
      return;
    }

    // Auto infer icon, English name, and Hindi translation
    const inferred = inferIconAndHindi(query);
    const slug = query.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

    const newItem: PantryItemMeta = {
      id: slug,
      label: inferred.nameEn,
      nameEn: inferred.nameEn,
      nameHi: inferred.nameHi,
      icon: inferred.icon,
    };

    // Save as persistent custom label for future autocomplete
    saveCustomPantryItem(newItem);
    setCustomItems(getCustomPantryItems());

    // Add to current in-stock items
    if (inferred.category === 'staple') {
      const next = new Set(staples);
      next.add(slug);
      setStaples(next);
      await onUpdatePantry({
        ...pantry,
        staplesInStock: Array.from(next),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const next = new Set(veggies);
      next.add(slug);
      setVeggies(next);
      await onUpdatePantry({
        ...pantry,
        availableVeggies: Array.from(next),
        lastUpdated: new Date().toISOString(),
      });
    }

    setSearchQuery('');
  };

  const totalCount = veggies.size + staples.size;

  const handleApply = async () => {
    await onUpdatePantry({
      ...pantry,
      availableVeggies: Array.from(veggies),
      staplesInStock: Array.from(staples),
      lastUpdated: new Date().toISOString(),
    });
    onApply();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md sm:max-w-xl md:max-w-2xl rounded-t-[28px] sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden"
        role="dialog"
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 sm:hidden" />

        {/* Clean Header: Title + Apply Button */}
        <div className="px-5 py-3.5 border-b border-orange-100 flex items-center justify-between bg-orange-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧊</span>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                {t.pantryTitle}
              </h3>
              <p className="text-[11px] text-amber-800 font-bold mt-0.5">
                {t.pantrySubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              {t.applyBtn}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-2xs border border-orange-100"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">

          {/* Clean "Show as you type" Search & Custom Add Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-orange-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder={t.searchIngredientPlaceholder}
                className="w-full h-11 pl-10 pr-10 rounded-2xl bg-orange-50/40 border border-orange-200/90 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white shadow-2xs transition-all"
              />
              {searchQuery.trim() ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Live Autocomplete & Custom Typing Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="mt-2 bg-white rounded-2xl border border-orange-200 shadow-xl overflow-hidden p-2 space-y-1 animate-in fade-in slide-in-from-top-1 z-20">
                {/* 1. Custom Item Add Action */}
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-orange-950 text-xs font-black flex items-center justify-between border border-orange-200/80 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="truncate">
                      {t.addCustomItem(searchQuery.trim())}
                    </span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white flex-shrink-0 ml-2">
                    Enter ↵
                  </span>
                </button>

                {/* 2. Matched Standard & Custom Library Items */}
                {searchResults.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pb-0.5">
                      {t.matchingResults}
                    </div>
                    {searchResults.slice(0, 8).map(item => {
                      const isAlreadyIn = veggies.has(item.id) || staples.has(item.id);
                      const displayName = language === 'hi' ? item.nameHi : item.nameEn;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (!isAlreadyIn) {
                              handleAddItem(item);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                            isAlreadyIn
                              ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-200'
                              : 'hover:bg-orange-50 text-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base">{item.icon}</span>
                            <span>{displayName}</span>
                          </span>
                          {isAlreadyIn ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'hi' ? 'शामिल है' : 'Added'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-orange-600 flex items-center gap-0.5">
                              <Plus className="w-3.5 h-3.5" />
                              <span>{language === 'hi' ? 'जोड़ें' : 'Add'}</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Currently In Fridge: Clean Active Pills Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>🧊</span>
                <span>{t.inFridgeCount(totalCount)}</span>
              </span>
              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.clearAll}</span>
                </button>
              )}
            </div>

            {totalCount > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-orange-50/40 border border-orange-200/60 min-h-[50px]">
                {selectedItemsList.map(item => {
                  const displayName = language === 'hi' ? item.nameHi : item.nameEn;
                  return (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white border border-orange-600 text-xs font-black shadow-2xs animate-in fade-in zoom-in-95 duration-150"
                    >
                      <span>{item.icon}</span>
                      <span>{displayName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-4 h-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center ml-0.5 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic px-1">
                {language === 'hi'
                  ? 'नीचे दी गई सब्ज़ियों पर टैप करें या ऊपर खोजें'
                  : 'Tap vegetables below or type in search bar above to add'}
              </p>
            )}
          </div>

          {/* Section 1: Fresh Vegetables & Dairy (Easy 1-Tap Toggle) */}
          <div className="pt-2 border-t border-orange-100/80 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span>🥬</span>
                <span>{language === 'hi' ? 'ताज़ी सब्ज़ियां व डेयरी' : 'Fresh Vegetables & Dairy'}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_VEGGIES.map(item => {
                const isSelected = veggies.has(item.id);
                const displayName = language === 'hi' ? item.nameHi : item.nameEn;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveItem(item.id);
                      } else {
                        handleAddItem(item);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs border border-emerald-600 font-black ring-2 ring-emerald-200'
                        : 'bg-white hover:bg-orange-50 text-slate-800 border border-orange-200/80 shadow-2xs'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{displayName}</span>
                    {isSelected ? (
                      <Check className="w-3 h-3 text-white ml-0.5" />
                    ) : (
                      <Plus className="w-3 h-3 text-slate-400 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Lentils & Pantry Staples (Easy 1-Tap Toggle) */}
          <div className="pt-2 border-t border-orange-100/80 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span>🌾</span>
                <span>{language === 'hi' ? 'दालें व रसोई सामग्री' : 'Lentils & Staples'}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_STAPLES.map(item => {
                const isSelected = staples.has(item.id);
                const displayName = language === 'hi' ? item.nameHi : item.nameEn;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveItem(item.id);
                      } else {
                        handleAddItem(item);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-2xs border border-amber-600 font-black ring-2 ring-amber-200'
                        : 'bg-white hover:bg-orange-50 text-slate-800 border border-orange-200/80 shadow-2xs'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{displayName}</span>
                    {isSelected ? (
                      <Check className="w-3 h-3 text-white ml-0.5" />
                    ) : (
                      <Plus className="w-3 h-3 text-slate-400 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Apply Action Bar */}
        <div className="p-3 border-t border-orange-100 bg-orange-50/40 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 px-1">
            {t.inFridgeCount(totalCount)}
          </span>
          <button
            onClick={handleApply}
            className="px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            {t.applyBtn} ✓
          </button>
        </div>

      </div>
    </div>
  );
};
