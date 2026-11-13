// ==============================================================================
// Grub2Day — Pantry & Fridge Matching Service
// Prioritizes recipes matching fresh vegetables and staples on hand
// ==============================================================================

import { Recipe, PantryState } from '../types';

export const STANDARD_VEGGIES = [
  { id: 'paneer', label: 'Paneer (पनीर)', icon: '🧀' },
  { id: 'eggs', label: 'Eggs (अंडे)', icon: '🥚' },
  { id: 'palak', label: 'Palak (पालक)', icon: '🥬' },
  { id: 'bhindi', label: 'Bhindi (भिंडी)', icon: '🥒' },
  { id: 'cauliflower', label: 'Gobhi (गोभी)', icon: '🥦' },
  { id: 'lauki', label: 'Lauki / Ghia (लौकी)', icon: '🥒' },
  { id: 'green_peas', label: 'Matar (मटर)', icon: '🫛' },
  { id: 'potato', label: 'Aloo (आलू)', icon: '🥔' },
  { id: 'onion', label: 'Pyaaz (प्याज़)', icon: '🧅' },
  { id: 'tomato', label: 'Tamatar (टमाटर)', icon: '🍅' },
  { id: 'capsicum', label: 'Shimla Mirch (शिमला मिर्च)', icon: '🫑' },
  { id: 'carrots', label: 'Gajar (गाजर)', icon: '🥕' },
  { id: 'eggplant', label: 'Baingan (बैंगन)', icon: '🍆' },
  { id: 'methi_leaves', label: 'Methi (मेथी पत्ता)', icon: '🌿' },
  { id: 'yellow_pumpkin', label: 'Kaddu / Sitaphal (कद्दू)', icon: '🎃' },
  { id: 'tori', label: 'Torai (तोरई)', icon: '🥒' },
  { id: 'arbi', label: 'Arbi (अरबी)', icon: '🥔' },
  { id: 'sprouts', label: 'Sprouts (अंकुरित मूँग/चना)', icon: '🌱' },
];

export const STANDARD_STAPLES = [
  { id: 'yellow_moong', label: 'Yellow Moong Dal' },
  { id: 'rajma', label: 'Rajma' },
  { id: 'kabuli_chana', label: 'Kabuli Chana (Chhole)' },
  { id: 'kala_chana', label: 'Kala Chana' },
  { id: 'besan', label: 'Besan (Gram Flour)' },
  { id: 'soya_chunks', label: 'Soya Chunks / Nutri' },
  { id: 'dahi', label: 'Curd / Dahi' },
  { id: 'atta', label: 'Wheat Atta' },
  { id: 'poha', label: 'Poha' },
  { id: 'suji', label: 'Suji / Rava' },
  { id: 'oats', label: 'Oats' },
  { id: 'lobia', label: 'Lobia' },
  { id: 'red_masoor', label: 'Masoor Dal' },
  { id: 'toor_dal', label: 'Toor Dal' },
  { id: 'urad_sabut', label: 'Urad Sabut (Black Lentils)' },
];

export interface PantryMatchResult {
  recipe: Recipe;
  matchScore: number; // 0 to 1
  matchedIngredients: string[];
  missingIngredients: string[];
  isFullyAvailable: boolean;
}

export function rankRecipesByPantry(
  recipes: Recipe[],
  pantry: PantryState
): PantryMatchResult[] {
  const availableSet = new Set<string>([
    ...pantry.availableVeggies,
    ...pantry.staplesInStock,
    'ghee', 'oil', 'jeera', 'garlic', 'ginger', 'hing', 'turmeric', 
    'coriander', 'salt', 'lemon', 'bread', 'rice', 'milk' // Everyday pantry defaults
  ]);

  const results: PantryMatchResult[] = recipes.map(recipe => {
    const matched: string[] = [];
    const missing: string[] = [];

    recipe.mainIngredients.forEach(ing => {
      if (availableSet.has(ing.toLowerCase())) {
        matched.push(ing);
      } else {
        missing.push(ing);
      }
    });

    const total = recipe.mainIngredients.length;
    const matchScore = total > 0 ? matched.length / total : 1;

    return {
      recipe,
      matchScore,
      matchedIngredients: matched,
      missingIngredients: missing,
      isFullyAvailable: missing.length === 0,
    };
  });

  // Sort by match score descending, then by protein descending
  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (b.recipe.baseProteinGrams + b.recipe.addedProteinGrams) - 
           (a.recipe.baseProteinGrams + a.recipe.addedProteinGrams);
  });
}
