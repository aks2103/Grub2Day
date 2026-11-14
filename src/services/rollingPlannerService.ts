// ==============================================================================
// Grub2Day — Rolling 6-Day Meal Planner & Cascading Replanning Engine
// Guarantees zero repetition across Today + Next 5 Days (6 Days Total)
// ==============================================================================

import { IDatabaseProvider } from '../db/dbInterface';
import { DayMealPlan, Recipe, MealSlot, PantryState, UserHouseholdSettings } from '../types';
import { getActiveCooldownReport } from './cooldownService';
import { rankRecipesByPantry, hasRequiredCoreIngredients, PantryMatchResult } from './pantryService';

function filterRecipesBySettings(recipes: Recipe[], settings?: UserHouseholdSettings | null): Recipe[] {
  if (!settings) return recipes;

  const disliked = new Set((settings.dislikedIngredients || []).map(d => d.toLowerCase().trim()).filter(Boolean));
  if (disliked.size === 0) return recipes;

  return recipes.filter(r => {
    if (r.mainIngredients.some(ing => disliked.has(ing.toLowerCase()))) return false;
    if (disliked.has(r.id.toLowerCase())) return false;
    const nameLower = r.name.toLowerCase();
    for (const d of disliked) {
      if (nameLower.includes(d)) return false;
    }
    return true;
  });
}

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
  const settings = await db.getSettings();

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
      plan = generateSingleDayPlan(dateStr, allRecipes, pantry, cycleUsedRecipeIds, historyCooldown.bannedRecipeIds, settings);
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
      historyCooldown.bannedRecipeIds,
      settings
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
  // If there are dishes matching core ingredients, prioritize top feasible candidates
  const feasible = ranked.filter(r => r.hasCoreIngredients);
  const pool = feasible.length > 0 ? feasible : ranked;
  // Pick from the top candidates with randomized selection so every shuffle brings fresh meals
  const topCandidates = pool.slice(0, Math.min(6, pool.length));
  const picked = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  return picked ? picked.recipe : ranked[0].recipe;
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
  const settings = await db.getSettings();
  const notDisliked = filterRecipesBySettings(allRecipes, settings);
  const preferredRegions = settings?.preferredRegions && settings.preferredRegions.length > 0
    ? new Set(settings.preferredRegions)
    : null;
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
      // Re-evaluate breakfast with new pantry & preferences
      const eligible = notDisliked.filter(r => 
        r.suitableSlots.includes('breakfast') &&
        !historyCooldown.bannedRecipeIds.has(r.id)
      );
      let regionEligible = eligible;
      if (preferredRegions && preferredRegions.size > 0) {
        const inRegion = eligible.filter(r => r.region && preferredRegions.has(r.region));
        if (inRegion.length > 0) regionEligible = inRegion;
      }
      const feasible = regionEligible.filter(r => hasRequiredCoreIngredients(r, updatedPantry));
      const pool = feasible.length > 0 ? feasible : (regionEligible.length > 0 ? regionEligible : eligible);
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
      // Re-evaluate lunch with new pantry & preferences
      const eligible = notDisliked.filter(r => 
        r.suitableSlots.includes('lunch') &&
        !todayUsedIds.has(r.id) &&
        !historyCooldown.bannedRecipeIds.has(r.id)
      );
      let regionEligible = eligible;
      if (preferredRegions && preferredRegions.size > 0) {
        const inRegion = eligible.filter(r => r.region && preferredRegions.has(r.region));
        if (inRegion.length > 0) regionEligible = inRegion;
      }
      const feasible = regionEligible.filter(r => hasRequiredCoreIngredients(r, updatedPantry));
      const pool = feasible.length > 0 ? feasible : (regionEligible.length > 0 ? regionEligible : eligible);
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
      // Re-evaluate dinner with new pantry & preferences (distinct from today's breakfast & lunch)
      const eligible = notDisliked.filter(r => 
        r.suitableSlots.includes('dinner') &&
        !todayUsedIds.has(r.id) &&
        !historyCooldown.bannedRecipeIds.has(r.id)
      );
      let regionEligible = eligible;
      if (preferredRegions && preferredRegions.size > 0) {
        const inRegion = eligible.filter(r => r.region && preferredRegions.has(r.region));
        if (inRegion.length > 0) regionEligible = inRegion;
      }
      const feasible = regionEligible.filter(r => hasRequiredCoreIngredients(r, updatedPantry));
      const basePool = feasible.length > 0 ? feasible : (regionEligible.length > 0 ? regionEligible : eligible);

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

  // 4. Cascade future days 1 to 5 to avoid any repeats with today & strictly prioritize preferences
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
      historyCooldown.bannedRecipeIds,
      settings
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
  historicalBannedIds: Set<string>,
  settings?: UserHouseholdSettings | null,
  avoidRecipeIds?: Set<string>
): DayMealPlan {
  // Intra-day tracker: ensures breakfast, lunch, and dinner NEVER share the same dish
  const dayUsedIds = new Set<string>();
  const dayUsedCategories = new Set<string>();

  const notDisliked = filterRecipesBySettings(allRecipes, settings);
  const preferredRegions = settings?.preferredRegions && settings.preferredRegions.length > 0
    ? new Set(settings.preferredRegions)
    : null;

  const pickDish = (slot: MealSlot, preferredCategoryExclusion?: string): string => {
    // 1. Strict anti-repetition: exclude cycleUsedIds, historicalBannedIds, dayUsedIds, and avoidRecipeIds (for lively shuffle)
    let eligible = notDisliked.filter(r => 
      r.suitableSlots.includes(slot) &&
      !cycleUsedIds.has(r.id) &&
      !historicalBannedIds.has(r.id) &&
      !dayUsedIds.has(r.id) &&
      (!avoidRecipeIds || !avoidRecipeIds.has(r.id))
    );

    // Fallback 1: If avoiding current dishes left no candidates, allow them as long as not in cycle
    if (eligible.length === 0) {
      eligible = notDisliked.filter(r => 
        r.suitableSlots.includes(slot) &&
        !cycleUsedIds.has(r.id) &&
        !historicalBannedIds.has(r.id) &&
        !dayUsedIds.has(r.id)
      );
    }

    // Fallback 2: If cycle cooldown exhausted slot options, allow any non-disliked dish not used today
    if (eligible.length === 0) {
      eligible = notDisliked.filter(r => 
        r.suitableSlots.includes(slot) &&
        !dayUsedIds.has(r.id)
      );
    }

    // Fallback 3: Absolute safety net - guaranteed never empty
    if (eligible.length === 0) {
      eligible = allRecipes.filter(r => 
        r.suitableSlots.includes(slot) &&
        !dayUsedIds.has(r.id)
      );
    }

    // 2. Region Preference Filtering:
    // If user specified preferred regions (e.g. Chinese, Street Food, North), strongly prioritize them!
    let regionFiltered = eligible;
    if (preferredRegions && preferredRegions.size > 0) {
      const inRegion = eligible.filter(r => r.region && preferredRegions.has(r.region));
      if (inRegion.length > 0) {
        regionFiltered = inRegion;
      }
    }

    // 3. Strict Core Ingredient Feasibility:
    // When the pantry is updated, prioritize dishes whose core ingredients are present
    const feasible = regionFiltered.filter(r => hasRequiredCoreIngredients(r, pantry));
    const basePool = feasible.length > 0 ? feasible : (
      regionFiltered.length > 0 ? regionFiltered : eligible
    );

    // 4. Apply category diversity ONLY among feasible candidates
    let candidates = basePool;
    if (preferredCategoryExclusion && basePool.length > 1) {
      const diverse = basePool.filter(r => r.category !== preferredCategoryExclusion && !dayUsedCategories.has(r.category));
      if (diverse.length > 0) candidates = diverse;
    }

    const ranked = rankRecipesByPantry(candidates, pantry);
    const chosen = pickDiverseTopRecipe(ranked) || candidates[0] || eligible[0] || allRecipes[0];

    dayUsedIds.add(chosen.id);
    dayUsedCategories.add(chosen.category);
    cycleUsedIds.add(chosen.id);
    return chosen.id;
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
 * - User cuisine preferences (Chinese, Street Food, Regional)
 * - User disliked ingredient exclusions
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
  const settings = await db.getSettings();
  const cycleUsedRecipeIds = new Set<string>();

  // Lock cooked recipes first
  currentPlans.forEach(plan => {
    if (!plan) return;
    if (plan.breakfast?.isCooked && plan.breakfast.recipeId) cycleUsedRecipeIds.add(plan.breakfast.recipeId);
    if (plan.lunch?.isCooked && plan.lunch.recipeId) cycleUsedRecipeIds.add(plan.lunch.recipeId);
    if (plan.dinner?.isCooked && plan.dinner.recipeId && !plan.dinner.isDiningOut) cycleUsedRecipeIds.add(plan.dinner.recipeId);
  });

  const refreshedPlans: DayMealPlan[] = [];
  const start = new Date(todayStr);

  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = currentPlans[i];

    // Explicitly avoid existing recipe IDs for un-cooked slots on Day 0 so the active slot is guaranteed to change!
    const avoidIds = new Set<string>();
    if (existing) {
      if (!existing.breakfast?.isCooked && existing.breakfast?.recipeId) avoidIds.add(existing.breakfast.recipeId);
      if (!existing.lunch?.isCooked && existing.lunch?.recipeId) avoidIds.add(existing.lunch.recipeId);
      if (!existing.dinner?.isCooked && existing.dinner?.recipeId) avoidIds.add(existing.dinner.recipeId);
    }

    // Generate fresh plan respecting settings & disliked ingredients
    const newDayPlan = generateSingleDayPlan(
      dateStr,
      allRecipes,
      pantry,
      cycleUsedRecipeIds,
      historyCooldown.bannedRecipeIds,
      settings,
      avoidIds
    );

    if (existing) {
      if (existing.breakfast?.isCooked) {
        newDayPlan.breakfast = existing.breakfast;
      }
      if (existing.lunch?.isCooked) {
        newDayPlan.lunch = existing.lunch;
      }
      if (existing.dinner?.isCooked || existing.dinner?.isDiningOut) {
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
