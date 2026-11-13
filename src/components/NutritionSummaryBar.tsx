import React from 'react';
import { Dumbbell, Flame, Target } from 'lucide-react';
import { DailyNutritionSummary } from '../services/nutritionService';

interface NutritionSummaryBarProps {
  summary: DailyNutritionSummary;
}

export const NutritionSummaryBar: React.FC<NutritionSummaryBarProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-600" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Alok's Daily Recomp Tracker
          </h3>
        </div>
        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${summary.statusBadge.color}`}>
          {summary.statusBadge.label}
        </span>
      </div>

      {/* Protein Progress */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1 text-slate-700">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Protein Intake</span>
          </span>
          <span className="text-slate-900 font-extrabold">
            {summary.totalProteinGrams}g <span className="text-slate-400 font-normal">/ {summary.proteinTarget}g</span>
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.proteinPercent)}%` }}
          />
        </div>
      </div>

      {/* Secondary Metrics & Smart Tip */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>{summary.totalCalories} / {summary.calorieTarget} kcal</span>
        </span>
        <span className="font-medium text-slate-600">
          {summary.smartRecommendation}
        </span>
      </div>
    </div>
  );
};
