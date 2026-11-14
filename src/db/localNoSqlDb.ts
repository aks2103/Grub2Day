// ==============================================================================
// Grub2Day — Local NoSQL Database Implementation
// Uses JSON document storage with collection semantics and reactive subscriptions
// ==============================================================================

import { IDatabaseProvider } from './dbInterface';
import { Recipe, DayMealPlan, PantryState, UserHouseholdSettings } from '../types';
import { SEED_RECIPES } from '../data/seedRecipes';
import { APP_CONFIG } from '../config/env';

const STORAGE_KEYS = {
  RECIPES: 'grub2day_collection_recipes',
  MEALS: 'grub2day_collection_meals',
  PANTRY: 'grub2day_doc_pantry',
  SETTINGS: 'grub2day_doc_settings',
};

export class LocalNoSqlDb implements IDatabaseProvider {
  private listeners: Set<(event: { collection: string; id: string }) => void> = new Set();

  async init(): Promise<void> {
    // 1. Seed & update recipes with Pan-Indian library (North, South, East, West)
    const existingRecipesRaw = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!existingRecipesRaw) {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(SEED_RECIPES));
    } else {
      try {
        const stored: Recipe[] = JSON.parse(existingRecipesRaw);
        const customRecipes = stored.filter(r => r.isCustom);
        const merged = [...SEED_RECIPES, ...customRecipes];
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(merged));
      } catch {
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(SEED_RECIPES));
      }
    }

    // 2. Initialize default pantry if not present
    const existingPantry = localStorage.getItem(STORAGE_KEYS.PANTRY);
    if (!existingPantry) {
      const defaultPantry: PantryState = {
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
      localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(defaultPantry));
    }

    // 3. Initialize default settings if not present
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!existingSettings) {
      const defaultSettings: UserHouseholdSettings = {
        isOnboarded: false,
        husbandName: APP_CONFIG.husbandName || 'Alok',
        wifeName: 'Wifey',
        wifeWhatsApp: '',
        husbandProteinTarget: APP_CONFIG.proteinTargetGrams,
        calorieTarget: APP_CONFIG.calorieTarget,
        hasKids: true,
        preferredRegions: ['north', 'south', 'west', 'east'],
        dislikedIngredients: [],
        diningOutDaysPerWeek: 1,
        cooldownDays: APP_CONFIG.cooldownDays,
        familyMembersNote: 'Parents + 2 young kids (<4 years, <6 months)',
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  }

  // --- Recipes ---
  async getAllRecipes(): Promise<Recipe[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!raw) return SEED_RECIPES;
    try {
      return JSON.parse(raw) as Recipe[];
    } catch {
      return SEED_RECIPES;
    }
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const all = await this.getAllRecipes();
    return all.find(r => r.id === id) || null;
  }

  async saveCustomRecipe(recipe: Recipe): Promise<void> {
    const all = await this.getAllRecipes();
    const index = all.findIndex(r => r.id === recipe.id);
    if (index >= 0) {
      all[index] = recipe;
    } else {
      all.push(recipe);
    }
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(all));
    this.notify({ collection: 'recipes', id: recipe.id });
  }

  async deleteCustomRecipe(id: string): Promise<void> {
    const all = await this.getAllRecipes();
    const filtered = all.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(filtered));
    this.notify({ collection: 'recipes', id });
  }

  // --- Meal Plans & History ---
  async getDayMealPlan(dateStr: string): Promise<DayMealPlan | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) return null;
    try {
      const mealsMap = JSON.parse(raw) as Record<string, DayMealPlan>;
      return mealsMap[dateStr] || null;
    } catch {
      return null;
    }
  }

  async saveDayMealPlan(plan: DayMealPlan): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    let mealsMap: Record<string, DayMealPlan> = {};
    if (raw) {
      try {
        mealsMap = JSON.parse(raw);
      } catch {
        mealsMap = {};
      }
    }
    mealsMap[plan.date] = plan;
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(mealsMap));
    this.notify({ collection: 'meals', id: plan.date });
  }

  async getMealHistory(daysBack: number, referenceDate?: string): Promise<DayMealPlan[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) return [];
    try {
      const mealsMap = JSON.parse(raw) as Record<string, DayMealPlan>;
      const ref = referenceDate ? new Date(referenceDate) : new Date();
      const result: DayMealPlan[] = [];

      for (let i = 1; i <= daysBack; i++) {
        const d = new Date(ref);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (mealsMap[dateStr]) {
          result.push(mealsMap[dateStr]);
        }
      }
      return result;
    } catch {
      return [];
    }
  }

  // --- Pantry State ---
  async getPantry(): Promise<PantryState> {
    const raw = localStorage.getItem(STORAGE_KEYS.PANTRY);
    if (raw) {
      try {
        return JSON.parse(raw) as PantryState;
      } catch {
        // fallback
      }
    }
    return {
      id: 'current',
      availableVeggies: ['paneer', 'palak', 'onion', 'tomato', 'bhindi', 'eggs'],
      staplesInStock: ['yellow_moong', 'rajma', 'besan', 'atta', 'dahi'],
      lastUpdated: new Date().toISOString(),
    };
  }

  async savePantry(pantry: PantryState): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantry));
    this.notify({ collection: 'pantry', id: 'current' });
  }

  // --- Household Settings ---
  async getSettings(): Promise<UserHouseholdSettings> {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      try {
        return JSON.parse(raw) as UserHouseholdSettings;
      } catch {
        // fallback
      }
    }
    const rawPhone = localStorage.getItem('wife_whatsapp_phone') || '';
    return {
      isOnboarded: false,
      husbandName: APP_CONFIG.husbandName || 'Alok',
      wifeName: 'Wifey',
      wifeWhatsApp: rawPhone,
      husbandProteinTarget: APP_CONFIG.proteinTargetGrams,
      calorieTarget: APP_CONFIG.calorieTarget,
      hasKids: true,
      preferredRegions: ['north', 'south', 'west', 'east'],
      dislikedIngredients: [],
      diningOutDaysPerWeek: 1,
      cooldownDays: APP_CONFIG.cooldownDays,
      familyMembersNote: 'Parents + 2 young kids (<4 years, <6 months)',
    };
  }

  async saveSettings(settings: UserHouseholdSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notify({ collection: 'settings', id: 'household' });
  }

  // --- Reactive Notifications ---
  subscribeToChanges(callback: (event: { collection: string; id: string }) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(event: { collection: string; id: string }) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error("Subscription callback error:", err);
      }
    });
  }
}
