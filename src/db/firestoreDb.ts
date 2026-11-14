// ==============================================================================
// Grub2Day — Cloud Firestore Database Provider
// Implements IDatabaseProvider interface for Firebase Cloud Firestore NoSQL
// Supports real-time multi-device sync between Alok & Wife
// ==============================================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { IDatabaseProvider } from './dbInterface';
import { Recipe, DayMealPlan, PantryState, UserHouseholdSettings } from '../types';
import { LocalNoSqlDb } from './localNoSqlDb';
import { APP_CONFIG } from '../config/env';
import { SEED_RECIPES } from '../data/seedRecipes';

export class FirestoreDbProvider implements IDatabaseProvider {
  private fallbackDb: LocalNoSqlDb;
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  public isConfigured: boolean = false;

  constructor() {
    this.fallbackDb = new LocalNoSqlDb();
  }

  async init(): Promise<void> {
    // Check if Firebase configuration keys are populated
    const { apiKey, projectId } = APP_CONFIG.firebase;

    if (!apiKey || !projectId || apiKey.includes('your-api-key') || projectId.includes('your-project-id')) {
      console.warn("Grub2Day: Firebase credentials missing or default in .env — using LocalNoSqlDb fallback.");
      await this.fallbackDb.init();
      this.isConfigured = false;
      return;
    }

    try {
      if (!getApps().length) {
        this.app = initializeApp(APP_CONFIG.firebase);
      } else {
        this.app = getApps()[0];
      }
      this.db = getFirestore(this.app);
      this.isConfigured = true;

      // Seed recipes into Firestore if collection is empty
      await this.seedRecipesIfEmpty();
    } catch (err) {
      console.error("Grub2Day: Failed to initialize Firebase Firestore, falling back to local NoSQL:", err);
      await this.fallbackDb.init();
      this.isConfigured = false;
    }
  }

  private async seedRecipesIfEmpty(): Promise<void> {
    if (!this.db) return;
    try {
      const snap = await getDocs(collection(this.db, 'recipes'));
      if (snap.empty) {
        console.log("Grub2Day: Seeding Firestore with Pan-Indian culinary library...");
        const batchPromises = SEED_RECIPES.map((recipe: Recipe) => 
          setDoc(doc(this.db!, 'recipes', recipe.id), recipe)
        );
        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.error("Grub2Day: Error checking or seeding Firestore recipes:", err);
    }
  }

  async getAllRecipes(): Promise<Recipe[]> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.getAllRecipes();
    }
    try {
      const snap = await getDocs(collection(this.db, 'recipes'));
      if (snap.empty) {
        return SEED_RECIPES;
      }
      return snap.docs.map(d => d.data() as Recipe);
    } catch (err) {
      console.warn("Firestore getAllRecipes failed, using fallback:", err);
      return this.fallbackDb.getAllRecipes();
    }
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.getRecipeById(id);
    }
    try {
      const snap = await getDoc(doc(this.db, 'recipes', id));
      if (!snap.exists()) return null;
      return snap.data() as Recipe;
    } catch (err) {
      console.warn("Firestore getRecipeById failed, using fallback:", err);
      return this.fallbackDb.getRecipeById(id);
    }
  }

  async saveCustomRecipe(recipe: Recipe): Promise<void> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.saveCustomRecipe(recipe);
    }
    await setDoc(doc(this.db, 'recipes', recipe.id), recipe);
  }

  async deleteCustomRecipe(id: string): Promise<void> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.deleteCustomRecipe(id);
    }
    await deleteDoc(doc(this.db, 'recipes', id));
  }

  async getDayMealPlan(dateStr: string): Promise<DayMealPlan | null> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.getDayMealPlan(dateStr);
    }
    try {
      const snap = await getDoc(doc(this.db, 'meal_plans', dateStr));
      if (!snap.exists()) return null;
      return snap.data() as DayMealPlan;
    } catch (err) {
      console.warn("Firestore getDayMealPlan failed, using fallback:", err);
      return this.fallbackDb.getDayMealPlan(dateStr);
    }
  }

  async saveDayMealPlan(plan: DayMealPlan): Promise<void> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.saveDayMealPlan(plan);
    }
    await setDoc(doc(this.db, 'meal_plans', plan.date), plan);
  }

  async getMealHistory(daysBack: number, referenceDate?: string): Promise<DayMealPlan[]> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.getMealHistory(daysBack, referenceDate);
    }
    try {
      const ref = referenceDate ? new Date(referenceDate) : new Date();
      const promises: Promise<DayMealPlan | null>[] = [];
      for (let i = 0; i < daysBack; i++) {
        const d = new Date(ref);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        promises.push(this.getDayMealPlan(dStr));
      }
      const results = await Promise.all(promises);
      return results.filter((p): p is DayMealPlan => p !== null);
    } catch (err) {
      console.warn("Firestore getMealHistory failed, using fallback:", err);
      return this.fallbackDb.getMealHistory(daysBack, referenceDate);
    }
  }

  async getPantry(): Promise<PantryState> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.getPantry();
    }
    try {
      const snap = await getDoc(doc(this.db, 'household', 'pantry'));
      if (!snap.exists()) {
        const defaultState: PantryState = {
          id: 'current',
          availableVeggies: [
            'paneer', 'palak', 'onion', 'tomato', 'potato', 'bhindi', 
            'cauliflower', 'green_peas', 'lauki', 'eggs'
          ],
          staplesInStock: [
            'yellow_moong', 'rajma', 'kabuli_chana', 'kala_chana', 
            'besan', 'atta', 'dahi', 'soya_chunks', 'poha'
          ],
          lastUpdated: new Date().toISOString(),
        };
        await setDoc(doc(this.db, 'household', 'pantry'), defaultState);
        return defaultState;
      }
      return snap.data() as PantryState;
    } catch (err) {
      console.warn("Firestore getPantry failed, using fallback:", err);
      return this.fallbackDb.getPantry();
    }
  }

  async savePantry(pantry: PantryState): Promise<void> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.savePantry(pantry);
    }
    await setDoc(doc(this.db, 'household', 'pantry'), pantry);
  }

  async getSettings(): Promise<UserHouseholdSettings> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.getSettings();
    }
    try {
      const snap = await getDoc(doc(this.db, 'household', 'settings'));
      if (!snap.exists()) {
        const initial = await this.fallbackDb.getSettings();
        await setDoc(doc(this.db, 'household', 'settings'), initial);
        return initial;
      }
      return snap.data() as UserHouseholdSettings;
    } catch (err) {
      return this.fallbackDb.getSettings();
    }
  }

  async saveSettings(settings: UserHouseholdSettings): Promise<void> {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.saveSettings(settings);
    }
    await setDoc(doc(this.db, 'household', 'settings'), settings);
  }

  subscribeToChanges(callback: (event: { collection: string; id: string }) => void): () => void {
    if (!this.isConfigured || !this.db) {
      return this.fallbackDb.subscribeToChanges(callback);
    }
    // Listen to real-time updates on meal plans collection
    try {
      const unsub = onSnapshot(collection(this.db, 'meal_plans'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          callback({
            collection: 'meal_plans',
            id: change.doc.id,
          });
        });
      });
      return unsub;
    } catch (err) {
      console.error("Firestore onSnapshot subscription failed:", err);
      return () => {};
    }
  }
}
