import React from 'react';
import { Refrigerator, RotateCcw, User } from 'lucide-react';

interface FoodieHeaderProps {
  currentDateStr: string;
  onOpenPantry: () => void;
  onReplanCycle: () => void;
  isReplanning?: boolean;
  householdName?: string;
  onOpenProfile?: () => void;
}

export const FoodieHeader: React.FC<FoodieHeaderProps> = ({
  currentDateStr,
  onOpenPantry,
  onReplanCycle,
  isReplanning = false,
  householdName,
  onOpenProfile,
}) => {
  const dateObj = new Date(currentDateStr);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="pt-[max(var(--sat),12px)] pb-2.5 px-3.5 border-b border-orange-100/70 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-md mx-auto">
        {/* Row 1: Brand Logo + Name & Top Controls */}
        <div className="flex items-center justify-between gap-2">
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-900 border border-orange-200/80 truncate max-w-[130px]">
                    {householdName.replace(/wifey/gi, 'Partner')}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-amber-700 mt-0.5 truncate">
                <span>{formattedDate}</span>
                <span className="mx-1">•</span>
                <span>Ghar Ka Swaad, Zero Repeat</span>
              </p>
            </div>
          </div>

          {/* Right Action Icons (Compact & Clean - Never Overflows) */}
          <div className="flex items-center gap-1 flex-shrink-0">
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
              className="h-8 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 text-xs font-bold border border-orange-200/70 transition-all flex items-center gap-1 shadow-2xs"
              title="What's in the kitchen & fridge"
            >
              <Refrigerator className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[11px]">Fridge</span>
            </button>

            {/* Re-roll 6 days */}
            <button
              onClick={onReplanCycle}
              disabled={isReplanning}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200/70 flex items-center justify-center transition-all disabled:opacity-50"
              title="Re-plan the 6-day cycle"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin text-orange-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
