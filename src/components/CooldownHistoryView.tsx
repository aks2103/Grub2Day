import React from 'react';
import { History, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { DayMealPlan, Recipe } from '../types';

interface CooldownHistoryViewProps {
  history: DayMealPlan[];
  recipesMap: Map<string, Recipe>;
  cooldownDays: number;
}

export const CooldownHistoryView: React.FC<CooldownHistoryViewProps> = ({
  history,
  recipesMap,
  cooldownDays = 6,
}) => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Rule Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-slate-900">
            6-Day Anti-Repetition Guard Active
          </h2>
          <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
            Every dish you mark as <span className="font-bold">"Cooked This"</span> enters a 6-day cooldown period. The planner will never repeat it before the 6-day timer expires, keeping your palate fresh and everyday meals exciting!
          </p>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 px-1">
          <History className="w-4 h-4 text-amber-600" />
          <span>Last {cooldownDays} Days Cooking Log</span>
        </h3>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
            No cooked meals recorded in the past 6 days yet. As you mark meals cooked on the Today screen, they will appear here!
          </div>
        ) : (
          history.map((dayPlan, index) => {
            const dateObj = new Date(dayPlan.date);
            const dateStr = dateObj.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            });
            const daysAgo = index + 1;
            const unlocksIn = Math.max(1, cooldownDays - daysAgo + 1);

            return (
              <div 
                key={dayPlan.date}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{dateStr}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    🔒 Unlocks in {unlocksIn}d
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Breakfast Slot */}
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      🌅 Breakfast
                    </span>
                    {dayPlan.breakfast.isCooked && dayPlan.breakfast.recipeId ? (
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {recipesMap.get(dayPlan.breakfast.recipeId)?.name || 'Custom Meal'}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not logged</span>
                    )}
                  </div>

                  {/* Lunch Slot */}
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      ☀️ Lunch
                    </span>
                    {dayPlan.lunch.isCooked && dayPlan.lunch.recipeId ? (
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {recipesMap.get(dayPlan.lunch.recipeId)?.name || 'Custom Meal'}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not logged</span>
                    )}
                  </div>

                  {/* Dinner Slot */}
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      🌙 Dinner
                    </span>
                    {dayPlan.dinner.isDiningOut ? (
                      <span className="font-bold text-amber-700 flex items-center gap-1">
                        <UtensilsCrossed className="w-3 h-3" /> Dining Out
                      </span>
                    ) : dayPlan.dinner.isCooked && dayPlan.dinner.recipeId ? (
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {recipesMap.get(dayPlan.dinner.recipeId)?.name || 'Custom Meal'}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not logged</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
