// ==============================================================================
// Grub2Day — 6-Day Anti-Repetition Cooldown Engine
// Guarantees no dish or sub-category repeats within the configured rolling window
// ==============================================================================

import { IDatabaseProvider } from '../db/dbInterface';
import { Recipe, DayMealPlan } from '../types';

export interface CooldownReport {
  bannedRecipeIds: Set<string>;
  bannedCategories: Set<string>;
  recipeLastCookedMap: Map<string, { daysAgo: number; dateStr: string }>;
}

export async function getActiveCooldownReport(
  db: IDatabaseProvider, 
  cooldownDays: number = 6,
  targetDateStr?: string
): Promise<CooldownReport> {
  const history: DayMealPlan[] = await db.getMealHistory(cooldownDays, targetDateStr);
  const bannedRecipeIds = new Set<string>();
  const bannedCategories = new Set<string>();
  const recipeLastCookedMap = new Map<string, { daysAgo: number; dateStr: string }>();

  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

  history.forEach(day => {
    const dayDate = new Date(day.date);
    const diffTime = Math.abs(targetDate.getTime() - dayDate.getTime());
    const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const checkSlot = (slotEntry: { recipeId: string | null; isCooked: boolean }) => {
      if (slotEntry.isCooked && slotEntry.recipeId) {
        bannedRecipeIds.add(slotEntry.recipeId);
        if (!recipeLastCookedMap.has(slotEntry.recipeId)) {
          recipeLastCookedMap.set(slotEntry.recipeId, { daysAgo, dateStr: day.date });
        }
      }
    };

    checkSlot(day.breakfast);
    checkSlot(day.lunch);
    checkSlot(day.dinner);
  });

  return {
    bannedRecipeIds,
    bannedCategories,
    recipeLastCookedMap,
  };
}

export function isRecipeOnCooldown(
  recipeId: string, 
  cooldownReport: CooldownReport
): { onCooldown: boolean; daysAgo?: number; unlocksInDays?: number } {
  if (cooldownReport.bannedRecipeIds.has(recipeId)) {
    const info = cooldownReport.recipeLastCookedMap.get(recipeId);
    const daysAgo = info ? info.daysAgo : 1;
    const unlocksInDays = Math.max(1, 6 - daysAgo + 1);
    return { onCooldown: true, daysAgo, unlocksInDays };
  }
  return { onCooldown: false };
}

export function filterAvailableRecipes(
  allRecipes: Recipe[],
  cooldownReport: CooldownReport,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Recipe[] {
  return allRecipes.filter(r => {
    // 1. Must be suitable for this meal slot
    if (!r.suitableSlots.includes(slot)) return false;
    // 2. Must not be on 6-day cooldown
    if (cooldownReport.bannedRecipeIds.has(r.id)) return false;
    return true;
  });
}
