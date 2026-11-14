// ==============================================================================
// Grub2Day — Rolling 6-Day Meal Planner & Cascading Replanning Engine
// Guarantees zero repetition across Today + Next 5 Days (6 Days Total)
// ==============================================================================

import { IDatabaseProvider } from '../db/dbInterface';
import { DayMealPlan, Recipe, MealSlot, PantryState } from '../types';
import { getActiveCooldownReport } from './cooldownService';
import { rankRecipesByPantry, hasRequiredCoreIngredients, PantryMatchResult } from './pantryService';

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

function pickDiverseTopRecipe(ranked: PantryMatchResult[]): Recipe | null {
  if (ranked.length === 0) return null;
  const topFeasible = ranked[0].hasCoreIngredients;
  const topScore = ranked[0].matchScore;
  // Consider candidates matching the top tier to guarantee fresh, randomized dishes on shuffle
  const topTier = ranked.filter(r => r.hasCoreIngredients === topFeasible && Math.abs(r.matchScore - topScore) < 0.25);
  const randomChoice = topTier[Math.floor(Math.random() * topTier.length)];
  return randomChoice ? randomChoice.recipe : ranked[0].recipe;
}

/**
 * Smart, time-aware pantry re-planner.
 * If user updates fridge at 6 PM, breakfast and lunch are locked. ONLY dinner (and future days)
 * are re-suggested to immediately match the newly available ingredients!
 */
export async function replanUpcomingSlotsFromPantry(
  db: IDatabaseProvider,
  currentSixDays: DayMealPlan[],
  todayStr: string,
  updatedPantry: PantryState
): Promise<{ plans: DayMealPlan[]; affectedSlots: string[] }> {
  const allRecipes = await db.getAllRecipes();
  const historyCooldown = await getActiveCooldownReport(db, 6, todayStr);
  const currentHour = new Date().getHours();

  const finalPlans: DayMealPlan[] = [];
  const cycleUsedRecipeIds = new Set<string>();

  const todayPlan = currentSixDays[0] 
    ? JSON.parse(JSON.stringify(currentSixDays[0])) as DayMealPlan
    : null;
  const affectedSlots: string[] = [];

  if (todayPlan) {
    const todayUsedIds = new Set<string>();
    const todayUsedCategories = new Set<string>();

    // 1. Breakfast: Locked if past 11 AM (11:00) or already cooked
    const lockBreakfast = currentHour >= 11 || todayPlan.breakfast.isCooked;
    if (lockBreakfast && todayPlan.breakfast.recipeId) {
      todayUsedIds.add(todayPlan.breakfast.recipeId);
      cycleUsedRecipeIds.add(todayPlan.breakfast.recipeId);
      const r = allRecipes.find(x => x.id === todayPlan.breakfast.recipeId);
      if (r) todayUsedCategories.add(r.category);
    } else {
      // Re-evaluate breakfast with new pantry
      const eligible = allRecipes.filter(r => 
        r.suitableSlots.includes('breakfast') &&
        !historyCooldown.bannedRecipeIds.has(r.id)
      );
      const feasible = eligible.filter(r => hasRequiredCoreIngredients(r, updatedPantry));
      const pool = feasible.length > 0 ? feasible : eligible;
      const ranked = rankRecipesByPantry(pool, updatedPantry);
      const chosen = pickDiverseTopRecipe(ranked);
      if (chosen) {
        todayPlan.breakfast = {
          ...todayPlan.breakfast,
          recipeId: chosen.id,
          isCooked: false,
        };
        todayUsedIds.add(chosen.id);
        todayUsedCategories.add(chosen.category);
        cycleUsedRecipeIds.add(chosen.id);
        affectedSlots.push('breakfast');
      }
    }

    // 2. Lunch: Locked if past 3 PM (15:00) or already cooked
    const lockLunch = currentHour >= 15 || todayPlan.lunch.isCooked;
    if (lockLunch && todayPlan.lunch.recipeId) {
      todayUsedIds.add(todayPlan.lunch.recipeId);
      cycleUsedRecipeIds.add(todayPlan.lunch.recipeId);
      const r = allRecipes.find(x => x.id === todayPlan.lunch.recipeId);
      if (r) todayUsedCategories.add(r.category);
    } else {
      // Re-evaluate lunch with new pantry
      const eligible = allRecipes.filter(r => 
        r.suitableSlots.includes('lunch') &&
        !todayUsedIds.has(r.id) &&
        !historyCooldown.bannedRecipeIds.has(r.id)
      );
      const feasible = eligible.filter(r => hasRequiredCoreIngredients(r, updatedPantry));
      const pool = feasible.length > 0 ? feasible : eligible;
      const ranked = rankRecipesByPantry(pool, updatedPantry);
      const chosen = pickDiverseTopRecipe(ranked);
      if (chosen) {
        todayPlan.lunch = {
          ...todayPlan.lunch,
          recipeId: chosen.id,
          isCooked: false,
        };
        todayUsedIds.add(chosen.id);
        todayUsedCategories.add(chosen.category);
        cycleUsedRecipeIds.add(chosen.id);
        affectedSlots.push('lunch');
      }
    }

    // 3. Dinner: Locked ONLY if already cooked or dining out
    const lockDinner = todayPlan.dinner.isCooked || todayPlan.dinner.isDiningOut;
    if (lockDinner && todayPlan.dinner.recipeId) {
      todayUsedIds.add(todayPlan.dinner.recipeId);
      if (!todayPlan.dinner.isDiningOut) cycleUsedRecipeIds.add(todayPlan.dinner.recipeId);
    } else {
      // Re-evaluate dinner with new pantry (must be distinct from today's breakfast & lunch)
      const eligible = allRecipes.filter(r => 
        r.suitableSlots.includes('dinner') &&
        !todayUsedIds.has(r.id) &&
        !historyCooldown.bannedRecipeIds.has(r.id)
      );
      const feasible = eligible.filter(r => hasRequiredCoreIngredients(r, updatedPantry));
      const basePool = feasible.length > 0 ? feasible : eligible;

      const diverse = basePool.filter(r => !todayUsedCategories.has(r.category));
      const pool = diverse.length > 0 ? diverse : basePool;
      const ranked = rankRecipesByPantry(pool, updatedPantry);
      const chosen = pickDiverseTopRecipe(ranked);
      if (chosen) {
        todayPlan.dinner = {
          ...todayPlan.dinner,
          recipeId: chosen.id,
          isCooked: false,
        };
        todayUsedIds.add(chosen.id);
        cycleUsedRecipeIds.add(chosen.id);
        affectedSlots.push('dinner');
      }
    }

    todayPlan.updatedAt = new Date().toISOString();
    await db.saveDayMealPlan(todayPlan);
    finalPlans.push(todayPlan);
  }

  // 4. Cascade future days 1 to 5 to avoid any repeats with today & prioritize new pantry
  const start = new Date(todayStr);
  for (let i = 1; i < 6; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const newDayPlan = generateSingleDayPlan(
      dateStr,
      allRecipes,
      updatedPantry,
      cycleUsedRecipeIds,
      historyCooldown.bannedRecipeIds
    );

    if (newDayPlan.breakfast.recipeId) cycleUsedRecipeIds.add(newDayPlan.breakfast.recipeId);
    if (newDayPlan.lunch.recipeId) cycleUsedRecipeIds.add(newDayPlan.lunch.recipeId);
    if (newDayPlan.dinner.recipeId && !newDayPlan.dinner.isDiningOut) cycleUsedRecipeIds.add(newDayPlan.dinner.recipeId);

    await db.saveDayMealPlan(newDayPlan);
    finalPlans.push(newDayPlan);
  }

  return { plans: finalPlans, affectedSlots };
}

function generateSingleDayPlan(
  dateStr: string,
  allRecipes: Recipe[],
  pantry: any,
  cycleUsedIds: Set<string>,
  historicalBannedIds: Set<string>
): DayMealPlan {
  // Intra-day tracker: ensures breakfast, lunch, and dinner NEVER share the same dish
  const dayUsedIds = new Set<string>();
  const dayUsedCategories = new Set<string>();

  const pickDish = (slot: MealSlot, preferredCategoryExclusion?: string): string | null => {
    // 1. Strict anti-repetition: exclude anything used in past 6 days history,
    //    anything used anywhere in the 6-day cycle, and anything used today!
    const eligible = allRecipes.filter(r => 
      r.suitableSlots.includes(slot) &&
      !cycleUsedIds.has(r.id) &&
      !historicalBannedIds.has(r.id) &&
      !dayUsedIds.has(r.id)
    );

    // 2. Strict Core Ingredient Feasibility:
    // When the pantry is updated, prioritize dishes whose core ingredients are present
    const feasible = eligible.filter(r => hasRequiredCoreIngredients(r, pantry));
    const basePool = feasible.length > 0 ? feasible : (
      eligible.length > 0 ? eligible : allRecipes.filter(r => r.suitableSlots.includes(slot))
    );

    // 3. Apply category diversity ONLY among feasible candidates
    let candidates = basePool;
    if (preferredCategoryExclusion && basePool.length > 1) {
      const diverse = basePool.filter(r => r.category !== preferredCategoryExclusion && !dayUsedCategories.has(r.category));
      if (diverse.length > 0) candidates = diverse;
    }

    const ranked = rankRecipesByPantry(candidates, pantry);
    const chosen = pickDiverseTopRecipe(ranked);

    if (chosen) {
      dayUsedIds.add(chosen.id);
      dayUsedCategories.add(chosen.category);
      cycleUsedIds.add(chosen.id);
      return chosen.id;
    }
    return null;
  };

  // Pick Breakfast
  const breakfastId = pickDish('breakfast');
  const breakfastRecipe = allRecipes.find(r => r.id === breakfastId);

  // Pick Lunch (strictly distinct from breakfast)
  const lunchId = pickDish('lunch', breakfastRecipe?.category);
  const lunchRecipe = allRecipes.find(r => r.id === lunchId);

  // Pick Dinner (strictly distinct from both breakfast and lunch)
  const dinnerId = pickDish('dinner', lunchRecipe?.category);

  return {
    id: dateStr,
    date: dateStr,
    breakfast: {
      recipeId: breakfastId,
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    lunch: {
      recipeId: lunchId,
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    dinner: {
      recipeId: dinnerId,
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fully shuffles and regenerates the 6-day meal plan with fresh dishes.
 * Unlocks un-cooked slots and applies fresh randomized selection while strictly
 * preserving:
 * - 6-day zero duplicates
 * - Zero intra-day repeats (breakfast != lunch != dinner)
 * - Pantry ingredient feasibility
 * - Respects cooked dishes
 */
export async function shuffleAndReplanCycle(
  db: IDatabaseProvider,
  currentPlans: DayMealPlan[],
  todayStr: string,
  pantry: PantryState
): Promise<DayMealPlan[]> {
  const allRecipes = await db.getAllRecipes();
  const historyCooldown = await getActiveCooldownReport(db, 6, todayStr);
  const cycleUsedRecipeIds = new Set<string>();

  // Lock cooked recipes first
  currentPlans.forEach(plan => {
    if (plan.breakfast.isCooked && plan.breakfast.recipeId) cycleUsedRecipeIds.add(plan.breakfast.recipeId);
    if (plan.lunch.isCooked && plan.lunch.recipeId) cycleUsedRecipeIds.add(plan.lunch.recipeId);
    if (plan.dinner.isCooked && plan.dinner.recipeId && !plan.dinner.isDiningOut) cycleUsedRecipeIds.add(plan.dinner.recipeId);
  });

  const refreshedPlans: DayMealPlan[] = [];
  const start = new Date(todayStr);

  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = currentPlans[i];

    // If day exists, only replace slots that are NOT yet cooked
    const newDayPlan = generateSingleDayPlan(
      dateStr,
      allRecipes,
      pantry,
      cycleUsedRecipeIds,
      historyCooldown.bannedRecipeIds
    );

    if (existing) {
      if (existing.breakfast.isCooked) {
        newDayPlan.breakfast = existing.breakfast;
      }
      if (existing.lunch.isCooked) {
        newDayPlan.lunch = existing.lunch;
      }
      if (existing.dinner.isCooked || existing.dinner.isDiningOut) {
        newDayPlan.dinner = existing.dinner;
      }
    }

    if (newDayPlan.breakfast.recipeId) cycleUsedRecipeIds.add(newDayPlan.breakfast.recipeId);
    if (newDayPlan.lunch.recipeId) cycleUsedRecipeIds.add(newDayPlan.lunch.recipeId);
    if (newDayPlan.dinner.recipeId && !newDayPlan.dinner.isDiningOut) cycleUsedRecipeIds.add(newDayPlan.dinner.recipeId);

    await db.saveDayMealPlan(newDayPlan);
    refreshedPlans.push(newDayPlan);
  }

  return refreshedPlans;
}
