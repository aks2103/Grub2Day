// ==============================================================================
// Grub2Day — Body Recomposition & Protein Engine
// Tailored for 36M, 180cm, 78kg (Target: 110-125g Protein, ~1800 kcal)
// ==============================================================================

import { DayMealPlan, Recipe } from '../types';

export interface DailyNutritionSummary {
  totalProteinGrams: number;
  totalCalories: number;
  proteinTarget: number;
  calorieTarget: number;
  proteinPercent: number;
  caloriePercent: number;
  proteinRemaining: number;
  statusBadge: {
    label: string;
    color: string; // Tailwind color class
  };
  smartRecommendation: string;
}

export function calculateDailyNutrition(
  plan: DayMealPlan,
  recipesMap: Map<string, Recipe>,
  proteinTarget: number = 120,
  calorieTarget: number = 1800
): DailyNutritionSummary {
  let totalProtein = 0;
  let totalCalories = 0;

  const processSlot = (entry: { 
    recipeId: string | null; 
    isDiningOut?: boolean; 
    husbandHadProteinBooster?: boolean 
  }) => {
    if (entry.isDiningOut) {
      // Estimated typical restaurant dinner (e.g. Tandoori Chicken / Paneer Tikka)
      totalProtein += 35;
      totalCalories += 650;
      return;
    }

    if (entry.recipeId && recipesMap.has(entry.recipeId)) {
      const recipe = recipesMap.get(entry.recipeId)!;
      totalProtein += recipe.baseProteinGrams;
      totalCalories += recipe.baseCalories;

      if (entry.husbandHadProteinBooster) {
        totalProtein += recipe.addedProteinGrams;
        // Estimate approx 60-120 kcal for booster depending on eggs/paneer/curd
        totalCalories += recipe.addedProteinGrams * 6;
      }
    }
  };

  processSlot(plan.breakfast);
  processSlot(plan.lunch);
  processSlot(plan.dinner);

  const proteinPercent = Math.min(100, Math.round((totalProtein / proteinTarget) * 100));
  const caloriePercent = Math.min(100, Math.round((totalCalories / calorieTarget) * 100));
  const proteinRemaining = Math.max(0, proteinTarget - totalProtein);

  let statusBadge = {
    label: 'Building Up',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  if (proteinPercent >= 100) {
    statusBadge = {
      label: 'Protein Target Crushed! 💪',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  } else if (proteinPercent >= 80) {
    statusBadge = {
      label: 'Almost There! 🔥',
      color: 'bg-teal-100 text-teal-800 border-teal-200',
    };
  }

  let smartRecommendation = '';
  if (proteinRemaining > 30) {
    smartRecommendation = `Currently need +${proteinRemaining}g protein. Don't skip the protein add-ons (eggs/paneer) with today's meals!`;
  } else if (proteinRemaining > 0) {
    smartRecommendation = `Just ${proteinRemaining}g away from your 120g goal. A bowl of roasted chana or 1 cup curd will close the gap!`;
  } else {
    smartRecommendation = `Awesome job! 120g+ protein reached today while keeping calories balanced. Lean recomp in progress!`;
  }

  return {
    totalProteinGrams: totalProtein,
    totalCalories: totalCalories,
    proteinTarget,
    calorieTarget,
    proteinPercent,
    caloriePercent,
    proteinRemaining,
    statusBadge,
    smartRecommendation,
  };
}
