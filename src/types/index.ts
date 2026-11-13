// ==============================================================================
// Grub2Day — Domain Models & Type Definitions
// ==============================================================================

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export type DishCategory = 
  | 'dal' 
  | 'legume' 
  | 'paneer' 
  | 'dry_sabzi' 
  | 'gravy_sabzi' 
  | 'egg_breakfast' 
  | 'desi_breakfast' 
  | 'quick_breakfast';

export interface Recipe {
  id: string;
  name: string;
  hindiName?: string;
  category: DishCategory;
  suitableSlots: MealSlot[];
  prepTimeMinutes: number;
  baseCalories: number;
  baseProteinGrams: number;
  mainIngredients: string[]; // e.g. ["paneer", "palak", "tomato"]
  description: string;
  kidFriendlyTip: string; // How to make it toddler friendly before adding heavy masala
  husbandProteinBooster: string; // Easy zero-cook or 2-min add-on to hit 30g+ protein
  addedProteinGrams: number; // Extra protein from booster
  isCustom?: boolean;
}

export interface MealSlotEntry {
  recipeId: string | null;
  recipeName?: string;
  isCooked: boolean;
  isDiningOut?: boolean;
  diningOutNotes?: string;
  husbandHadProteinBooster?: boolean;
  notes?: string;
}

export interface DayMealPlan {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  breakfast: MealSlotEntry;
  lunch: MealSlotEntry;
  dinner: MealSlotEntry;
  updatedAt: string;
}

export interface PantryState {
  id: string; // 'current'
  availableVeggies: string[];
  staplesInStock: string[];
  lastUpdated: string;
}

export interface UserHouseholdSettings {
  cooldownDays: number;
  husbandProteinTarget: number;
  calorieTarget: number;
  familyMembersNote: string;
}
