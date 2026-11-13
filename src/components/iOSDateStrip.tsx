import React from 'react';
import { DayMealPlan } from '../types';

interface IOSDateStripProps {
  plans: DayMealPlan[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export const IOSDateStrip: React.FC<IOSDateStripProps> = ({
  plans,
  selectedIndex,
  onSelectIndex,
}) => {
  return (
    <div className="py-2.5 max-w-md mx-auto">
      {/* 6-Day Row: Exactly fits iPhone 13 (390px) screen width */}
      <div className="grid grid-cols-6 gap-1.5">
        {plans.map((dayPlan, idx) => {
          const dateObj = new Date(dayPlan.date);
          const isSelected = selectedIndex === idx;
          const isToday = idx === 0;

          const dayAbbr = isToday 
            ? 'TODAY' 
            : dateObj.toLocaleDateString('en-IN', { weekday: 'narrow' });
          const dateNum = dateObj.getDate();

          const allCooked = 
            dayPlan.breakfast.isCooked && 
            dayPlan.lunch.isCooked && 
            (dayPlan.dinner.isCooked || dayPlan.dinner.isDiningOut);

          return (
            <button
              key={dayPlan.date}
              onClick={() => onSelectIndex(idx)}
              className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ios-press ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100/70 hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <span className={`text-[9px] font-bold tracking-tight block ${
                isSelected ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                {isToday ? 'TODAY' : dayAbbr}
              </span>
              <span className="text-base font-bold tracking-tight mt-0.5 leading-none">
                {dateNum}
              </span>
              
              {/* Cooked Status Indicator Dot */}
              <span className={`w-1 h-1 rounded-full mt-1.5 ${
                allCooked 
                  ? (isSelected ? 'bg-emerald-400' : 'bg-emerald-500')
                  : (isSelected ? 'bg-transparent' : 'bg-transparent')
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
