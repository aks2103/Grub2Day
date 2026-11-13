import React, { useState } from 'react';
import { Sparkles, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { FoodieQuote, getRandomQuote } from '../data/quotes';

interface NavbarProps {
  currentDateStr: string;
  onDateChange: (newDateStr: string) => void;
  activeTab: 'today' | 'pantry' | 'history' | 'recipes';
  onTabChange: (tab: 'today' | 'pantry' | 'history' | 'recipes') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDateStr,
  onDateChange,
  activeTab,
  onTabChange,
}) => {
  const [quote, setQuote] = useState<FoodieQuote>(getRandomQuote());

  const handleNextQuote = () => {
    setQuote(getRandomQuote());
  };

  const shiftDate = (days: number) => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const isToday = currentDateStr === new Date().toISOString().split('T')[0];

  const formattedDate = new Date(currentDateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="bg-white border-b border-amber-100 sticky top-0 z-30 shadow-sm">
      {/* Catchy Desi Quote Ribbon */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-3 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="text-base">{quote.emoji}</span>
          <span className="font-medium tracking-tight">"{quote.quote}"</span>
          <span className="opacity-80 hidden sm:inline">— {quote.author}</span>
        </div>
        <button 
          onClick={handleNextQuote}
          title="Next witty food quote"
          className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-100 hover:text-white" />
        </button>
      </div>

      {/* Main Header Row */}
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-inner">
            🍲
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xl tracking-tight text-slate-900">
                Grub<span className="text-amber-500">2Day</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Ghar Ka Khana • 6-Day No Repeat • High Protein
            </p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-200/80 rounded-xl p-1">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDateChange(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs font-semibold text-slate-800 flex items-center gap-1 hover:bg-white rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{isToday ? 'Today' : formattedDate}</span>
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-3xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'today', label: "Today's Menu", icon: '🍽️' },
          { id: 'pantry', label: 'Fridge & Pantry', icon: '🧊' },
          { id: 'history', label: '6-Day Cooldown', icon: '⏱️' },
          { id: 'recipes', label: 'Recipe Bank (60+)', icon: '📖' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
