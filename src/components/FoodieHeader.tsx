import React from 'react';
import { Refrigerator, RotateCcw, User, Languages } from 'lucide-react';

interface FoodieHeaderProps {
  currentDateStr: string;
  onOpenPantry: () => void;
  householdName?: string;
  onOpenProfile?: () => void;
  language?: 'en' | 'hi';
  onToggleLanguage?: () => void;
}

export const FoodieHeader: React.FC<FoodieHeaderProps> = ({
  currentDateStr,
  onOpenPantry,
  householdName,
  onOpenProfile,
  language = 'en',
  onToggleLanguage,
}) => {
  const dateObj = new Date(currentDateStr);
  const formattedDate = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="pt-[max(var(--sat),12px)] pb-2.5 px-3.5 border-b border-orange-100/70 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
        {/* Row 1: Brand Logo + Name & Top Controls */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand & Household Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-sm shadow-orange-500/20 flex-shrink-0">
              🍲
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  Grub<span className="text-orange-500">2Day</span>
                </h1>
                {householdName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-900 border border-orange-200/80 truncate max-w-[85px] xs:max-w-[110px] sm:max-w-[160px]">
                    {householdName.replace(/wifey/gi, 'Partner')}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-amber-700 mt-0.5 truncate">
                <span>{formattedDate}</span>
                <span className="mx-1">•</span>
                <span>{language === 'hi' ? 'घर का स्वाद, रोज़ नया स्वाद' : 'Fresh Home Meals, Zero Monotony'}</span>
              </p>
            </div>
          </div>

          {/* Right Action Icons (Compact & Clean - Never Overflows) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Language Toggle */}
            {onToggleLanguage && (
              <button
                onClick={onToggleLanguage}
                className="h-8 px-2 rounded-xl bg-amber-50 hover:bg-amber-100/90 active:scale-95 text-amber-900 border border-amber-200/80 text-[11px] font-black transition-all flex items-center gap-1 shadow-2xs"
                title={language === 'hi' ? 'Switch to English' : 'Switch to Hindi (हिंदी)'}
              >
                <Languages className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'hi' ? 'HI' : 'EN'}</span>
              </button>
            )}

            {/* Household Profile Button */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/70 flex items-center justify-center transition-all shadow-2xs"
                title="Household Profile & Settings"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pantry / Fridge Button */}
            <button
              onClick={onOpenPantry}
              className="h-8 px-2 sm:px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 text-xs font-bold border border-orange-200/70 transition-all flex items-center gap-1 shadow-2xs"
              title="What's in the kitchen & fridge"
            >
              <Refrigerator className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[11px] hidden xs:inline">Fridge</span>
            </button>

            {/* Refresh / Reload Whole Site */}
            <button
              onClick={() => window.location.reload()}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200/70 flex items-center justify-center transition-all shadow-2xs"
              title="Reload and refresh site"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
