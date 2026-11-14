import React from 'react';
import { DayMealPlan, Recipe } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface FoodieDateStripProps {
  plans: DayMealPlan[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  recipesMap: Map<string, Recipe>;
  language?: 'en' | 'hi';
}

export const FoodieDateStrip: React.FC<FoodieDateStripProps> = ({
  plans,
  selectedIndex,
  onSelectIndex,
  recipesMap,
  language = 'en',
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="py-2.5 max-w-md sm:max-w-xl md:max-w-2xl mx-auto w-full">
      {/* 6-Day Clean iOS Grid Strip */}
      <div className="grid grid-cols-6 gap-1.5 w-full">
        {plans.map((dayPlan, idx) => {
          const dateObj = new Date(dayPlan.date);
          const isSelected = selectedIndex === idx;
          const isToday = idx === 0;

          const dayLabel = isToday 
            ? t.today 
            : t.daysShort[dateObj.getDay()];
          const dateNum = dateObj.getDate();

          const lunchRecipe = dayPlan.lunch.recipeId ? recipesMap.get(dayPlan.lunch.recipeId) : null;
          const dishPreview = lunchRecipe 
            ? (language === 'hi' ? lunchRecipe.hindiName || lunchRecipe.name : lunchRecipe.name.split(' ')[0])
            : (language === 'hi' ? 'भोजन' : 'Meal');

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
              {/* Day Label (e.g. Today / आज, Sun / रवि) */}
              <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${
                isSelected ? 'text-amber-100' : 'text-amber-800'
              }`}>
                {dayLabel}
              </span>

              {/* Date Number */}
              <span className="text-base font-black tracking-tight my-0.5 leading-none">
                {dateNum}
              </span>

              {/* Dish Preview & Cooked Status Indicator */}
              <div className="w-full px-0.5 flex items-center justify-center gap-0.5 mt-0.5">
                <span className={`text-[9px] font-bold truncate max-w-[42px] leading-tight ${
                  isSelected ? 'text-white' : 'text-slate-500'
                }`}>
                  {dishPreview}
                </span>
                {allCooked && (
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isSelected ? 'bg-white' : 'bg-emerald-500'
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
