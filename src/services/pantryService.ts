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
  hasCoreIngredients: boolean;
}

/**
 * Validates whether the household actually possesses the mandatory core ingredient(s)
 * required for the recipe. For example:
 * - A dal recipe CANNOT be cooked if 0 lentils are in stock.
 * - A paneer recipe CANNOT be cooked if paneer is not in stock.
 * - An aloo recipe requires potato in stock.
 */
export function hasRequiredCoreIngredients(recipe: Recipe, pantry: PantryState): boolean {
  const veggies = new Set(pantry.availableVeggies.map(v => v.toLowerCase()));
  const staples = new Set(pantry.staplesInStock.map(s => s.toLowerCase()));

  // 1. Dal recipes / Sambar / Lentil dishes: MUST have at least one dal/staple in stock!
  if (recipe.category === 'dal' || recipe.name.toLowerCase().includes('dal') || recipe.name.toLowerCase().includes('sambar')) {
    const dalIngredients = ['toor_dal', 'yellow_moong', 'red_masoor', 'urad_sabut', 'chana_dal', 'urad_dal', 'whole_green_moong', 'besan'];
    const hasAnyDal = recipe.mainIngredients.some(ing => dalIngredients.includes(ing.toLowerCase()) && staples.has(ing.toLowerCase()));
    if (!hasAnyDal) return false;
  }

  // 2. Legume recipes: MUST have the legume in stock!
  if (recipe.category === 'legume') {
    const legumeIngredients = ['rajma', 'kabuli_chana', 'kala_chana', 'lobia', 'soya_chunks', 'moth_beans_sprouts', 'white_peas'];
    const hasAnyLegume = recipe.mainIngredients.some(ing => legumeIngredients.includes(ing.toLowerCase()) && (staples.has(ing.toLowerCase()) || veggies.has(ing.toLowerCase())));
    if (!hasAnyLegume) return false;
  }

  // 3. Paneer recipes: MUST have paneer in stock!
  if (recipe.category === 'paneer' || recipe.name.toLowerCase().includes('paneer') || recipe.mainIngredients.map(i => i.toLowerCase()).includes('paneer')) {
    if (!veggies.has('paneer')) return false;
  }

  // 4. Egg recipes: MUST have eggs in stock!
  if (recipe.category === 'egg_breakfast' || recipe.name.toLowerCase().includes('egg') || recipe.mainIngredients.map(i => i.toLowerCase()).includes('eggs')) {
    if (!veggies.has('eggs')) return false;
  }

  // 5. Mandatory individual vegetable checks:
  // If a recipe is explicitly built around a specific vegetable, that vegetable MUST be in the kitchen/fridge!
  const mandatorySingleVeggies = [
    'bhindi', 'palak', 'cauliflower', 'lauki', 'potato', 
    'eggplant', 'methi_leaves', 'yellow_pumpkin', 'tori', 'arbi'
  ];
  for (const veg of mandatorySingleVeggies) {
    if (recipe.mainIngredients.map(i => i.toLowerCase()).includes(veg) && !veggies.has(veg)) {
      return false;
    }
  }

  // 6. Mandatory individual staple / legume / pulse checks:
  // If a recipe requires a specific pulse, grain or flour (e.g. besan, suji, poha, toor_dal), it MUST be in stock!
  const mandatoryStaples = [
    'toor_dal', 'yellow_moong', 'red_masoor', 'urad_sabut', 'chana_dal', 
    'urad_dal', 'whole_green_moong', 'besan', 'rajma', 'kabuli_chana', 
    'kala_chana', 'lobia', 'soya_chunks', 'sattu', 'suji', 'poha', 'sev'
  ];
  for (const staple of mandatoryStaples) {
    if (recipe.mainIngredients.map(i => i.toLowerCase()).includes(staple) && !staples.has(staple)) {
      return false;
    }
  }

  return true;
}

export function rankRecipesByPantry(
  recipes: Recipe[],
  pantry: PantryState
): PantryMatchResult[] {
  const availableSet = new Set<string>([
    ...pantry.availableVeggies.map(v => v.toLowerCase()),
    ...pantry.staplesInStock.map(s => s.toLowerCase()),
    'ghee', 'oil', 'jeera', 'garlic', 'ginger', 'hing', 'turmeric', 
    'coriander', 'salt', 'lemon', 'bread', 'rice', 'milk' // Everyday pantry defaults
  ]);

  const results: PantryMatchResult[] = recipes.map(recipe => {
    const matched: string[] = [];
    const missing: string[] = [];
    const coreAvailable = hasRequiredCoreIngredients(recipe, pantry);

    recipe.mainIngredients.forEach(ing => {
      if (availableSet.has(ing.toLowerCase())) {
        matched.push(ing);
      } else {
        missing.push(ing);
      }
    });

    const total = recipe.mainIngredients.length;
    // If the recipe is missing its non-negotiable core ingredient (e.g. no dal for Dal Tadka),
    // heavily penalize matchScore to 0!
    const rawScore = total > 0 ? matched.length / total : 1;
    const matchScore = coreAvailable ? rawScore : 0;

    return {
      recipe,
      matchScore,
      matchedIngredients: matched,
      missingIngredients: missing,
      isFullyAvailable: coreAvailable && missing.length === 0,
      hasCoreIngredients: coreAvailable,
    };
  });

  // Sort strictly by:
  // 1. Core feasibility (hasCoreIngredients)
  // 2. Match score descending
  // 3. Protein descending
  return results.sort((a, b) => {
    if (a.hasCoreIngredients !== b.hasCoreIngredients) {
      return a.hasCoreIngredients ? -1 : 1;
    }
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (b.recipe.baseProteinGrams + b.recipe.addedProteinGrams) - 
           (a.recipe.baseProteinGrams + a.recipe.addedProteinGrams);
  });
}
