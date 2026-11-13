import React from 'react';
import { RotateCcw, Refrigerator } from 'lucide-react';

interface IOSHeaderProps {
  currentDateStr: string;
  onOpenPantry: () => void;
  onReplanCycle: () => void;
  isReplanning?: boolean;
}

export const IOSHeader: React.FC<IOSHeaderProps> = ({
  currentDateStr,
  onOpenPantry,
  onReplanCycle,
  isReplanning = false,
}) => {
  const dateObj = new Date(currentDateStr);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <header className="pt-[max(var(--sat),12px)] pb-3 px-4 border-b border-neutral-100 bg-white sticky top-0 z-20">
      <div className="max-w-md mx-auto flex items-end justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-neutral-400 block mb-0.5">
            {formattedDate}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">
            Grub2Day
          </h1>
        </div>

        {/* Quiet, Apple-style Circular Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPantry}
            className="h-9 px-3 rounded-full bg-neutral-100 hover:bg-neutral-200/80 active:scale-95 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="What's in the fridge"
          >
            <Refrigerator className="w-3.5 h-3.5 text-neutral-600" />
            <span>Pantry</span>
          </button>

          <button
            onClick={onReplanCycle}
            disabled={isReplanning}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 active:scale-95 text-neutral-600 flex items-center justify-center transition-all disabled:opacity-50"
            title="Re-roll 6-day cycle"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin text-neutral-900' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
