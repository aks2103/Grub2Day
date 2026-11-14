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
    <div className="py-2.5 max-w-md mx-auto w-full">
      {/* 6-Day Clean iOS Grid Strip */}
      <div className="grid grid-cols-6 gap-1.5 w-full">
        {plans.map((dayPlan, idx) => {
          const dateObj = new Date(dayPlan.date);
          const isSelected = selectedIndex === idx;
          const isToday = idx === 0;

          const dayLabel = isToday 
            ? 'Today' 
            : dateObj.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3);
          const dateNum = dateObj.getDate();

          const lunchRecipe = dayPlan.lunch.recipeId ? recipesMap.get(dayPlan.lunch.recipeId) : null;
          const dishPreview = lunchRecipe ? lunchRecipe.name.split(' ')[0] : 'Meal';

          const allCooked = 
            dayPlan.breakfast.isCooked && 
            dayPlan.lunch.isCooked && 
            (dayPlan.dinner.isCooked || dayPlan.dinner.isDiningOut);

          return (
            <button
              key={dayPlan.date}
              onClick={() => onSelectIndex(idx)}
              className={`py-2 px-0.5 rounded-2xl flex flex-col items-center justify-between transition-all ios-press border ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-500 to-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-orange-50/50 border-orange-200/60 hover:bg-orange-100/60 text-slate-700'
              }`}
            >
              {/* Day Label (e.g. Today, Sun, Mon) */}
              <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${
                isSelected ? 'text-amber-100' : 'text-amber-800'
              }`}>
                {dayLabel}
              </span>

              {/* Date Number */}
              <span className="text-base font-black tracking-tight my-0.5 leading-none">
                {dateNum}
              </span>

              {/* Dish Preview Tag */}
              <span className={`text-[9px] font-bold truncate max-w-[48px] px-0.5 leading-tight ${
                isSelected ? 'text-white/95' : 'text-slate-500'
              }`}>
                {dishPreview}
              </span>

              {/* Cooked Status Indicator */}
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                allCooked 
                  ? 'bg-emerald-400 ring-2 ring-white/60' 
                  : (isSelected ? 'bg-orange-200' : 'bg-transparent')
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
