// ==============================================================================
// Grub2Day — Cloud Firestore Provider (Ready for future switch)
// Implements IDatabaseProvider interface for Firebase Firestore NoSQL
// ==============================================================================

import { IDatabaseProvider } from './dbInterface';
import { Recipe, DayMealPlan, PantryState, UserHouseholdSettings } from '../types';
import { LocalNoSqlDb } from './localNoSqlDb';

export class FirestoreDbProvider implements IDatabaseProvider {
  // Falls back gracefully to LocalNoSqlDb if Firebase configs are not yet populated
  private fallbackDb: LocalNoSqlDb;
  public isConfigured: boolean = false;

  constructor() {
    this.fallbackDb = new LocalNoSqlDb();
  }

  async init(): Promise<void> {
    await this.fallbackDb.init();
    // When Firebase credentials are set in .env, initialize Firebase App & Firestore here:
    // const app = initializeApp(firebaseConfig);
    // this.db = getFirestore(app);
    this.isConfigured = false;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return this.fallbackDb.getAllRecipes();
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    return this.fallbackDb.getRecipeById(id);
  }

  async saveCustomRecipe(recipe: Recipe): Promise<void> {
    return this.fallbackDb.saveCustomRecipe(recipe);
  }

  async deleteCustomRecipe(id: string): Promise<void> {
    return this.fallbackDb.deleteCustomRecipe(id);
  }

  async getDayMealPlan(dateStr: string): Promise<DayMealPlan | null> {
    return this.fallbackDb.getDayMealPlan(dateStr);
  }

  async saveDayMealPlan(plan: DayMealPlan): Promise<void> {
    return this.fallbackDb.saveDayMealPlan(plan);
  }

  async getMealHistory(daysBack: number, referenceDate?: string): Promise<DayMealPlan[]> {
    return this.fallbackDb.getMealHistory(daysBack, referenceDate);
  }

  async getPantry(): Promise<PantryState> {
    return this.fallbackDb.getPantry();
  }

  async savePantry(pantry: PantryState): Promise<void> {
    return this.fallbackDb.savePantry(pantry);
  }

  async getSettings(): Promise<UserHouseholdSettings> {
    return this.fallbackDb.getSettings();
  }

  async saveSettings(settings: UserHouseholdSettings): Promise<void> {
    return this.fallbackDb.saveSettings(settings);
  }

  subscribeToChanges(callback: (event: { collection: string; id: string }) => void): () => void {
    return this.fallbackDb.subscribeToChanges(callback);
  }
}
