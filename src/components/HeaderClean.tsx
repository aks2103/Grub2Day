import React from 'react';
import { Refrigerator, RefreshCw, Bot } from 'lucide-react';

interface HeaderCleanProps {
  onOpenPantry: () => void;
  onReplanCycle: () => void;
  onOpenGeminiChat: () => void;
  isReplanning?: boolean;
}

export const HeaderClean: React.FC<HeaderCleanProps> = ({
  onOpenPantry,
  onReplanCycle,
  onOpenGeminiChat,
  isReplanning = false,
}) => {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Heartfelt Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shadow-xs">
            🍲
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              Grub<span className="text-amber-500">2Day</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Ghar Ka Khana • 6-Day Rolling Variety
            </p>
          </div>
        </div>

        {/* Minimal Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Fridge Pantry */}
          <button
            onClick={onOpenPantry}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Check off fridge ingredients"
          >
            <Refrigerator className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Fridge</span>
          </button>

          {/* Gemini AI Assistant */}
          <button
            onClick={onOpenGeminiChat}
            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Ask Gemini Chef for suggestions or substitutes"
          >
            <Bot className="w-3.5 h-3.5 text-amber-600" />
            <span>Gemini AI</span>
          </button>

          {/* Re-Plan 6 Days */}
          <button
            onClick={onReplanCycle}
            disabled={isReplanning}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Re-plan the 6-day cycle"
          >
            <RefreshCw className={`w-4 h-4 ${isReplanning ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
