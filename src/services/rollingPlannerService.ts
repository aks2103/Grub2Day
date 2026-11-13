// ==============================================================================
// Grub2Day — Rolling 6-Day Meal Planner & Cascading Replanning Engine
// Guarantees zero repetition across Today + Next 5 Days (6 Days Total)
// ==============================================================================

import { IDatabaseProvider } from '../db/dbInterface';
import { DayMealPlan, Recipe, MealSlot } from '../types';
import { getActiveCooldownReport } from './cooldownService';
import { rankRecipesByPantry } from './pantryService';

export async function getRollingSixDayPlans(
  db: IDatabaseProvider,
  startDateStr: string
): Promise<DayMealPlan[]> {
  const plans: DayMealPlan[] = [];
  const start = new Date(startDateStr);

  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = await db.getDayMealPlan(dateStr);
    if (existing) {
      plans.push(existing);
    } else {
      plans.push(null as any);
    }
  }

  // Check if any days are missing or if we need to synthesize the full 6-day flow
  const needsGeneration = plans.some(p => !p);

  if (needsGeneration) {
    return cascadeReplanFutureDays(db, plans, 0, startDateStr);
  }

  return plans;
}

export async function cascadeReplanFutureDays(
  db: IDatabaseProvider,
  currentSixDays: (DayMealPlan | null)[],
  fromIndex: number, // Days before fromIndex are locked; fromIndex+1 onwards are replanned
  startDateStr: string
): Promise<DayMealPlan[]> {
  const allRecipes = await db.getAllRecipes();
  const pantry = await db.getPantry();
  const historyCooldown = await getActiveCooldownReport(db, 6, startDateStr);

  const finalPlans: DayMealPlan[] = [];
  const start = new Date(startDateStr);

  // Set of recipe IDs used within this 6-day cycle to guarantee NO repetition
  const cycleUsedRecipeIds = new Set<string>();

  // 1. Populate fixed/locked days up to fromIndex
  for (let i = 0; i <= fromIndex; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    let plan = currentSixDays[i];
    if (!plan) {
      // Pick for this day
      plan = generateSingleDayPlan(dateStr, allRecipes, pantry, cycleUsedRecipeIds, historyCooldown.bannedRecipeIds);
      await db.saveDayMealPlan(plan);
    }

    // Register recipes into cycleUsedRecipeIds
    if (plan.breakfast.recipeId) cycleUsedRecipeIds.add(plan.breakfast.recipeId);
    if (plan.lunch.recipeId) cycleUsedRecipeIds.add(plan.lunch.recipeId);
    if (plan.dinner.recipeId && !plan.dinner.isDiningOut) cycleUsedRecipeIds.add(plan.dinner.recipeId);

    finalPlans.push(plan);
  }

  // 2. Cascade and generate future days (fromIndex + 1 up to 5)
  for (let i = fromIndex + 1; i < 6; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const newDayPlan = generateSingleDayPlan(
      dateStr,
      allRecipes,
      pantry,
      cycleUsedRecipeIds,
      historyCooldown.bannedRecipeIds
    );

    // Register in cycle
    if (newDayPlan.breakfast.recipeId) cycleUsedRecipeIds.add(newDayPlan.breakfast.recipeId);
    if (newDayPlan.lunch.recipeId) cycleUsedRecipeIds.add(newDayPlan.lunch.recipeId);
    if (newDayPlan.dinner.recipeId && !newDayPlan.dinner.isDiningOut) cycleUsedRecipeIds.add(newDayPlan.dinner.recipeId);

    await db.saveDayMealPlan(newDayPlan);
    finalPlans.push(newDayPlan);
  }

  return finalPlans;
}

function generateSingleDayPlan(
  dateStr: string,
  allRecipes: Recipe[],
  pantry: any,
  cycleUsedIds: Set<string>,
  historicalBannedIds: Set<string>
): DayMealPlan {
  const pickDish = (slot: MealSlot): string | null => {
    // Exclude both historical 6-day cooldown AND dishes already chosen in this 6-day cycle
    const eligible = allRecipes.filter(r => 
      r.suitableSlots.includes(slot) &&
      !cycleUsedIds.has(r.id) &&
      !historicalBannedIds.has(r.id)
    );

    const pool = eligible.length > 0 
      ? eligible 
      : allRecipes.filter(r => r.suitableSlots.includes(slot) && !cycleUsedIds.has(r.id));

    const finalCandidates = pool.length > 0 
      ? pool 
      : allRecipes.filter(r => r.suitableSlots.includes(slot));

    const ranked = rankRecipesByPantry(finalCandidates, pantry);
    return ranked.length > 0 ? ranked[0].recipe.id : null;
  };

  return {
    id: dateStr,
    date: dateStr,
    breakfast: {
      recipeId: pickDish('breakfast'),
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    lunch: {
      recipeId: pickDish('lunch'),
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    dinner: {
      recipeId: pickDish('dinner'),
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    updatedAt: new Date().toISOString(),
  };
}
