// ==============================================================================
// Grub2Day — Meal Planner Orchestration Service
// Handles daily plan generation, swaps, dining-out toggles & cooldown enforcement
// ==============================================================================

import { IDatabaseProvider } from '../db/dbInterface';
import { DayMealPlan, MealSlot, Recipe } from '../types';
import { getActiveCooldownReport, filterAvailableRecipes } from './cooldownService';
import { rankRecipesByPantry } from './pantryService';

export async function getOrCreateDayPlan(
  db: IDatabaseProvider,
  dateStr: string
): Promise<{ plan: DayMealPlan; isNewlyCreated: boolean }> {
  const existing = await db.getDayMealPlan(dateStr);
  if (existing) {
    return { plan: existing, isNewlyCreated: false };
  }

  // Generate fresh suggestions respecting 6-day cooldown and pantry
  const allRecipes = await db.getAllRecipes();
  const pantry = await db.getPantry();
  const cooldownReport = await getActiveCooldownReport(db, 6, dateStr);

  const pickBestCandidate = (slot: MealSlot): string | null => {
    const candidates = filterAvailableRecipes(allRecipes, cooldownReport, slot);
    if (candidates.length === 0) {
      // If all on cooldown, fallback to any slot recipe
      const fallbacks = allRecipes.filter(r => r.suitableSlots.includes(slot));
      return fallbacks.length > 0 ? fallbacks[0].id : null;
    }
    const ranked = rankRecipesByPantry(candidates, pantry);
    return ranked.length > 0 ? ranked[0].recipe.id : null;
  };

  const newPlan: DayMealPlan = {
    id: dateStr,
    date: dateStr,
    breakfast: {
      recipeId: pickBestCandidate('breakfast'),
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    lunch: {
      recipeId: pickBestCandidate('lunch'),
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    dinner: {
      recipeId: pickBestCandidate('dinner'),
      isCooked: false,
      husbandHadProteinBooster: true,
    },
    updatedAt: new Date().toISOString(),
  };

  await db.saveDayMealPlan(newPlan);
  return { plan: newPlan, isNewlyCreated: true };
}

export async function getSwapOptions(
  db: IDatabaseProvider,
  dateStr: string,
  slot: MealSlot,
  currentRecipeId?: string | null,
  cycleUsedIds?: Set<string>
): Promise<Recipe[]> {
  const allRecipes = await db.getAllRecipes();
  const pantry = await db.getPantry();
  const cooldownReport = await getActiveCooldownReport(db, 6, dateStr);

  const candidates = filterAvailableRecipes(allRecipes, cooldownReport, slot)
    .filter(r => r.id !== currentRecipeId && (!cycleUsedIds || !cycleUsedIds.has(r.id)));

  // If strict filtering leaves fewer than 3, fallback to slot candidates not on cooldown
  const pool = candidates.length >= 3 
    ? candidates 
    : filterAvailableRecipes(allRecipes, cooldownReport, slot).filter(r => r.id !== currentRecipeId);

  const ranked = rankRecipesByPantry(pool, pantry);
  return ranked.slice(0, 5).map(r => r.recipe);
}

export async function updateMealSlot(
  db: IDatabaseProvider,
  dateStr: string,
  slot: MealSlot,
  updates: Partial<DayMealPlan[MealSlot]>
): Promise<DayMealPlan> {
  const current = (await db.getDayMealPlan(dateStr)) || (await getOrCreateDayPlan(db, dateStr)).plan;

  current[slot] = {
    ...current[slot],
    ...updates,
  };
  current.updatedAt = new Date().toISOString();

  await db.saveDayMealPlan(current);
  return current;
}
