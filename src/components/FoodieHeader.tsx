import React from 'react';
import { Refrigerator, RotateCcw } from 'lucide-react';

interface FoodieHeaderProps {
  currentDateStr: string;
  onOpenPantry: () => void;
  onReplanCycle: () => void;
  isReplanning?: boolean;
}

export const FoodieHeader: React.FC<FoodieHeaderProps> = ({
  currentDateStr,
  onOpenPantry,
  onReplanCycle,
  isReplanning = false,
}) => {
  const dateObj = new Date(currentDateStr);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="pt-[max(var(--sat),14px)] pb-3 px-4 border-b border-orange-100/80 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand with warm foodie personality */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-sm shadow-orange-500/20">
            🍲
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Grub<span className="text-orange-500">2Day</span>
              </h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Rasoi
              </span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700/80 mt-0.5 flex items-center gap-1">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>Ghar Ka Swaad, Zero Repeat</span>
            </p>
          </div>
        </div>

        {/* Foodie Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Pantry / Fridge Button */}
          <button
            onClick={onOpenPantry}
            className="h-9 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 active:scale-95 text-orange-900 text-xs font-bold border border-orange-200/70 transition-all flex items-center gap-1.5 shadow-2xs"
            title="What's in the kitchen & fridge"
          >
            <Refrigerator className="w-3.5 h-3.5 text-orange-600" />
            <span>Fridge</span>
          </button>

          {/* Re-roll 6 days */}
          <button
            onClick={onReplanCycle}
            disabled={isReplanning}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200/70 flex items-center justify-center transition-all disabled:opacity-50"
            title="Re-plan the 6-day menu"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
