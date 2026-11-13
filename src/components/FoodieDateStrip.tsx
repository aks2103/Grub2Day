import React from 'react';
import { DayMealPlan, Recipe } from '../types';

interface FoodieDateStripProps {
  plans: DayMealPlan[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  recipesMap: Map<string, Recipe>;
}

export const FoodieDateStrip: React.FC<FoodieDateStripProps> = ({
  plans,
  selectedIndex,
  onSelectIndex,
  recipesMap,
}) => {
  return (
    <div className="py-3 max-w-md mx-auto">
      {/* 6-Day Horizontal Foodie Strip */}
      <div className="grid grid-cols-6 gap-1.5">
        {plans.map((dayPlan, idx) => {
          const dateObj = new Date(dayPlan.date);
          const isSelected = selectedIndex === idx;
          const isToday = idx === 0;

          const dayName = isToday 
            ? 'TODAY' 
            : dateObj.toLocaleDateString('en-IN', { weekday: 'narrow' });
          const dateNum = dateObj.getDate();

          const lunchRecipe = dayPlan.lunch.recipeId ? recipesMap.get(dayPlan.lunch.recipeId) : null;
          const dishSnippet = lunchRecipe ? lunchRecipe.name.split(' ')[0] : 'Meal';

          const allCooked = 
            dayPlan.breakfast.isCooked && 
            dayPlan.lunch.isCooked && 
            (dayPlan.dinner.isCooked || dayPlan.dinner.isDiningOut);

          return (
            <button
              key={dayPlan.date}
              onClick={() => onSelectIndex(idx)}
              className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-between transition-all ios-press border ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-500 to-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25'
                  : 'bg-orange-50/40 border-orange-200/50 hover:bg-orange-100/60 text-slate-700'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className={`text-[9px] font-extrabold tracking-tight ${
                  isSelected ? 'text-amber-100' : 'text-amber-800/70'
                }`}>
                  {dayName}
                </span>
                <span className="text-base font-black tracking-tight mt-0.5 leading-none">
                  {dateNum}
                </span>
              </div>

              {/* Mini Food Preview Tag */}
              <span className={`text-[8px] font-bold truncate max-w-full px-1 mt-1 ${
                isSelected ? 'text-white/90' : 'text-slate-500'
              }`}>
                {dishSnippet}
              </span>

              {/* Cooked dot */}
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                allCooked 
                  ? 'bg-emerald-400 ring-2 ring-white/50' 
                  : (isSelected ? 'bg-orange-400' : 'bg-transparent')
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
