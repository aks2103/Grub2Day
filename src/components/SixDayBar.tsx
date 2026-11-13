import React from 'react';
import { DayMealPlan, Recipe } from '../types';

interface SixDayBarProps {
  plans: DayMealPlan[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  recipesMap: Map<string, Recipe>;
  viewMode: 'single' | 'all';
  onToggleViewMode: (mode: 'single' | 'all') => void;
}

export const SixDayBar: React.FC<SixDayBarProps> = ({
  plans,
  selectedIndex,
  onSelectIndex,
  recipesMap,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <div className="mb-5 space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          6-Day Menu • Zero Repeats (Breakfast, Lunch & Dinner)
        </h2>
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
          <button
            onClick={() => onToggleViewMode('single')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs font-bold' : ''
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => onToggleViewMode('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : ''
            }`}
          >
            All 6 Days
          </button>
        </div>
      </div>

      {/* Horizontal Day Chips */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {plans.map((dayPlan, idx) => {
          const dateObj = new Date(dayPlan.date);
          const isSelected = selectedIndex === idx;
          const isToday = idx === 0;

          const dayLabel = isToday 
            ? 'Today' 
            : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
          const dateLabel = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

          const lunchRecipe = dayPlan.lunch.recipeId ? recipesMap.get(dayPlan.lunch.recipeId) : null;
          const dinnerRecipe = dayPlan.dinner.recipeId ? recipesMap.get(dayPlan.dinner.recipeId) : null;

          return (
            <button
              key={dayPlan.date}
              onClick={() => {
                onSelectIndex(idx);
                if (viewMode === 'all') onToggleViewMode('single');
              }}
              className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-extrabold uppercase ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                    {dayLabel}
                  </span>
                  {dayPlan.dinner.isDiningOut && (
                    <span className="text-[10px]" title="Dining Out">🍕</span>
                  )}
                </div>
                <div className="font-extrabold text-xs sm:text-sm mt-0.5 leading-tight">
                  {dateLabel}
                </div>
              </div>

              {/* Short Dish Preview */}
              <div className={`mt-2 text-[10px] truncate ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                {lunchRecipe ? lunchRecipe.name.split(' ')[0] : 'Meal'} • {dinnerRecipe ? dinnerRecipe.name.split(' ')[0] : 'Meal'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
