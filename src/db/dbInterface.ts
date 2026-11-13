// ==============================================================================
// Grub2Day — NoSQL Database Provider Interface
// Allows seamless switching between Local NoSQL and Cloud Firestore
// ==============================================================================

import { Recipe, DayMealPlan, PantryState, UserHouseholdSettings } from '../types';

export interface IDatabaseProvider {
  // Initialization & Seeding
  init(): Promise<void>;

  // Recipes Collection
  getAllRecipes(): Promise<Recipe[]>;
  getRecipeById(id: string): Promise<Recipe | null>;
  saveCustomRecipe(recipe: Recipe): Promise<void>;
  deleteCustomRecipe(id: string): Promise<void>;

  // Meal History & Plans Collection
  getDayMealPlan(dateStr: string): Promise<DayMealPlan | null>;
  saveDayMealPlan(plan: DayMealPlan): Promise<void>;
  getMealHistory(daysBack: number, referenceDate?: string): Promise<DayMealPlan[]>;

  // Pantry State Document
  getPantry(): Promise<PantryState>;
  savePantry(pantry: PantryState): Promise<void>;

  // Household Settings Document
  getSettings(): Promise<UserHouseholdSettings>;
  saveSettings(settings: UserHouseholdSettings): Promise<void>;

  // Real-time or Local Change Subscription
  subscribeToChanges(callback: (event: { collection: string; id: string }) => void): () => void;
}
