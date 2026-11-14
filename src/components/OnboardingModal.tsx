// ==============================================================================
// Grub2Day — User Sign-up & Household Onboarding Experience
// Personalizes family names, wife's WhatsApp, kids' profile, and regional cuisine
// ==============================================================================

import React, { useState } from 'react';
import { 
  Sparkles, Users, Dumbbell, Check, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { UserHouseholdSettings, IndianRegion } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (settings: UserHouseholdSettings) => Promise<void>;
  initialSettings?: UserHouseholdSettings | null;
}

const REGION_OPTIONS: { id: IndianRegion; label: string; icon: string; desc: string }[] = [
  { id: 'north', label: 'North Indian', icon: '🏔️', desc: 'Dal Makhani, Rajma, Paneer, Desi Parathas' },
  { id: 'south', label: 'South Indian', icon: '🌴', desc: 'Sambar, Rasam, Idli, Upma, Avial' },
  { id: 'west', label: 'West Indian', icon: '🌊', desc: 'Pav Bhaji, Dal Baati, Sev Tamatar, Poha' },
  { id: 'east', label: 'East Indian', icon: '🌾', desc: 'Litti Chokha, Chholar Dal, Aloo Posto' },
];

const DISLIKE_CANDIDATES = [
  { id: 'karela', label: 'Karela (Bitter Gourd)' },
  { id: 'baingan', label: 'Baingan (Eggplant)' },
  { id: 'tori', label: 'Tori / Turai (Ridge Gourd)' },
  { id: 'tinda', label: 'Tinda (Apple Gourd)' },
  { id: 'arbi', label: 'Arbi (Colocasia)' },
  { id: 'yellow_pumpkin', label: 'Kaddu (Pumpkin)' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialSettings,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  const [husbandName, setHusbandName] = useState<string>(initialSettings?.husbandName || 'Alok');
  const [wifeName, setWifeName] = useState<string>(() => {
    if (initialSettings?.wifeName && initialSettings.wifeName !== 'Wifey') {
      return initialSettings.wifeName;
    }
    return 'Partner';
  });
  const [wifeWhatsApp, setWifeWhatsApp] = useState<string>(() => {
    const raw = initialSettings?.wifeWhatsApp || localStorage.getItem('wife_whatsapp_phone') || '';
    return raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;
  });
  const [hasKids, setHasKids] = useState<boolean>(initialSettings?.hasKids ?? true);
  const [proteinTarget, setProteinTarget] = useState<number>(initialSettings?.husbandProteinTarget || 120);
  const [selectedRegions, setSelectedRegions] = useState<Set<IndianRegion>>(
    new Set(initialSettings?.preferredRegions || ['north', 'south', 'west', 'east'])
  );
  const [disliked, setDisliked] = useState<Set<string>>(
    new Set(initialSettings?.dislikedIngredients || [])
  );
  const [userEmail, setUserEmail] = useState<string>(initialSettings?.userEmail || '');

  if (!isOpen) return null;

  const toggleRegion = (reg: IndianRegion) => {
    const next = new Set(selectedRegions);
    if (next.has(reg)) {
      if (next.size > 1) next.delete(reg); // Keep at least one
    } else {
      next.add(reg);
    }
    setSelectedRegions(next);
  };

  const toggleDislike = (id: string) => {
    const next = new Set(disliked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDisliked(next);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    let cleanedPhone = wifeWhatsApp.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }

    // Save phone to localStorage as well for instant WhatsApp deep-link
    if (cleanedPhone) {
      localStorage.setItem('wife_whatsapp_phone', cleanedPhone);
    }

    const payload: UserHouseholdSettings = {
      isOnboarded: true,
      husbandName: husbandName.trim() || 'Alok',
      wifeName: wifeName.trim() || 'Wifey',
      wifeWhatsApp: cleanedPhone,
      husbandProteinTarget: proteinTarget,
      calorieTarget: 1800,
      hasKids,
      preferredRegions: Array.from(selectedRegions),
      dislikedIngredients: Array.from(disliked),
      diningOutDaysPerWeek: 1,
      cooldownDays: 6,
      familyMembersNote: hasKids ? 'Parents + 2 young kids (<4 years, <6 months)' : 'Couple',
      userEmail: userEmail.trim(),
      householdName: `${husbandName.trim() || 'Alok'} & ${wifeName.trim() || 'Partner'}'s Kitchen`,
    };

    await onComplete(payload);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-orange-100 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
      >
        {/* Header with App Branding & Progress Indicator */}
        <div className="pt-4 pb-3 px-5 border-b border-orange-100 bg-gradient-to-r from-amber-50/70 to-orange-50/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍲</span>
              <span className="text-base font-black text-slate-900 tracking-tight">
                Grub<span className="text-orange-500">2Day</span>
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-orange-900 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
              Step {step} of 3
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: COUPLE & HOUSEHOLD */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center pb-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Welcome! Who's cooking & dining?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Let's personalize your household and connect notifications.
                </p>
              </div>

              {/* First Partner Name */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Your Name:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={husbandName}
                    onChange={(e) => setHusbandName(e.target.value)}
                    placeholder="e.g. Alok"
                    className="w-full h-10 px-3 rounded-xl border border-orange-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">👤</span>
                </div>
              </div>

              {/* Second Partner Name */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Partner's Name:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={wifeName}
                    onChange={(e) => setWifeName(e.target.value)}
                    placeholder="e.g. Partner's name"
                    className="w-full h-10 px-3 rounded-xl border border-orange-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-rose-400">✨</span>
                </div>
              </div>

              {/* Partner WhatsApp Number */}
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💬</span>
                  <label className="text-xs font-black text-slate-900 block">
                    Partner's WhatsApp Mobile Number:
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={wifeWhatsApp}
                    onChange={(e) => setWifeWhatsApp(e.target.value)}
                    placeholder="9876543210 (10 digits)"
                    className="w-full h-10 pl-11 pr-3 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Enables 1-tap dish sharing & cravings directly into their WhatsApp chat!
                </p>
              </div>

              {/* Kids Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Young Kids in Family?
                    </span>
                    <span className="text-[11px] text-amber-800 font-semibold">
                      Enables kid-friendly tips for every dish
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hasKids}
                  onChange={(e) => setHasKids(e.target.checked)}
                  className="w-5 h-5 rounded-lg text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEP 2: NUTRITION & PROTEIN GOALS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center pb-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Daily Nutrition & Protein Goal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-protein balanced meal architecture tailored to your goals.
                </p>
              </div>

              {/* Protein Target Box */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                  Daily Protein Goal
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {proteinTarget} <span className="text-base text-emerald-700 font-bold">grams / day</span>
                </div>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Target for body recomposition: hitting 110–125g protein daily ensures fat loss while preserving lean muscle mass.
                </p>

                {/* Preset Pills */}
                <div className="flex justify-center gap-2 pt-1">
                  {[100, 110, 120, 130].map(val => (
                    <button
                      key={val}
                      onClick={() => setProteinTarget(val)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                        proteinTarget === val
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {val}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Protein Boosters Note */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-black text-slate-900 block">Zero Extra Cooking Friction:</span>
                  The app automatically pairs quick 2-minute clean protein boosters (e.g. boiled eggs, paneer cubes, or Greek curd) alongside standard family meals.
                </div>
              </div>

              {/* Optional Email */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Your Email (Optional, for account backup):
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="alok@example.com"
                  className="w-full h-10 px-3 rounded-xl border border-orange-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          )}

          {/* STEP 3: REGIONAL CUISINES & VEGGIE PREFERENCES */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center pb-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Pan-Indian Flavors You Love
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your favorite regions and any vegetables to avoid.
                </p>
              </div>

              {/* Region Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 block">
                  Select Cuisines to Include in 6-Day Cycles:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REGION_OPTIONS.map(r => {
                    const active = selectedRegions.has(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleRegion(r.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          active
                            ? 'bg-orange-500 text-white border-orange-600 shadow-2xs ring-2 ring-orange-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{r.icon}</span>
                          {active && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-xs font-black block truncate">{r.label}</span>
                        <span className={`text-[10px] block truncate ${active ? 'text-orange-100' : 'text-slate-400'}`}>
                          {r.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dislikes / Exclude */}
              <div className="pt-2">
                <label className="text-xs font-black text-slate-800 block mb-1.5">
                  Any vegetables you dislike or avoid?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DISLIKE_CANDIDATES.map(v => {
                    const isDisliked = disliked.has(v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => toggleDislike(v.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          isDisliked
                            ? 'bg-rose-500 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {isDisliked ? `✕ Avoid ${v.label.split('(')[0]}` : v.label.split('(')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 border-t border-orange-100 bg-orange-50/40 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="h-10 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Curating Plans...' : 'Start Planning! 🍲'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
