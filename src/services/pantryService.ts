// ==============================================================================
// Grub2Day — Pantry & Fridge Matching Service
// Prioritizes recipes matching fresh vegetables and staples on hand
// ==============================================================================

import { Recipe, PantryState } from '../types';

export interface PantryItemMeta {
  id: string;
  label: string;
  nameEn: string;
  nameHi: string;
  icon?: string;
}

export const STANDARD_VEGGIES: PantryItemMeta[] = [
  { id: 'paneer', label: 'Paneer (पनीर)', nameEn: 'Paneer', nameHi: 'पनीर', icon: '🧀' },
  { id: 'eggs', label: 'Eggs (अंडे)', nameEn: 'Eggs', nameHi: 'अंडे', icon: '🥚' },
  { id: 'palak', label: 'Palak (पालक)', nameEn: 'Spinach', nameHi: 'पालक', icon: '🥬' },
  { id: 'bhindi', label: 'Bhindi (भिंडी)', nameEn: 'Okra', nameHi: 'भिंडी', icon: '🥒' },
  { id: 'cauliflower', label: 'Gobhi (गोभी)', nameEn: 'Cauliflower', nameHi: 'गोभी', icon: '🥦' },
  { id: 'lauki', label: 'Lauki / Ghia (लौकी)', nameEn: 'Bottle Gourd', nameHi: 'लौकी', icon: '🥒' },
  { id: 'green_peas', label: 'Matar (मटर)', nameEn: 'Green Peas', nameHi: 'मटर', icon: '🫛' },
  { id: 'potato', label: 'Aloo (आलू)', nameEn: 'Potato', nameHi: 'आलू', icon: '🥔' },
  { id: 'onion', label: 'Pyaaz (प्याज़)', nameEn: 'Onion', nameHi: 'प्याज़', icon: '🧅' },
  { id: 'tomato', label: 'Tamatar (टमाटर)', nameEn: 'Tomato', nameHi: 'टमाटर', icon: '🍅' },
  { id: 'capsicum', label: 'Shimla Mirch (शिमला मिर्च)', nameEn: 'Bell Pepper (Capsicum)', nameHi: 'शिमला मिर्च', icon: '🫑' },
  { id: 'carrots', label: 'Gajar (गाजर)', nameEn: 'Carrots', nameHi: 'गाजर', icon: '🥕' },
  { id: 'eggplant', label: 'Baingan (बैंगन)', nameEn: 'Eggplant (Brinjal)', nameHi: 'बैंगन', icon: '🍆' },
  { id: 'methi_leaves', label: 'Methi (मेथी पत्ता)', nameEn: 'Fenugreek Leaves', nameHi: 'मेथी पत्ता', icon: '🌿' },
  { id: 'yellow_pumpkin', label: 'Kaddu / Sitaphal (कद्दू)', nameEn: 'Pumpkin', nameHi: 'कद्दू', icon: '🎃' },
  { id: 'tori', label: 'Torai (तोरई)', nameEn: 'Ridge Gourd', nameHi: 'तोरई', icon: '🥒' },
  { id: 'arbi', label: 'Arbi (अरबी)', nameEn: 'Colocasia (Arbi)', nameHi: 'अरबी', icon: '🥔' },
  { id: 'sprouts', label: 'Sprouts (अंकुरित मूँग/चना)', nameEn: 'Sprouts', nameHi: 'अंकुरित मूँग', icon: '🌱' },
];

export const STANDARD_STAPLES: PantryItemMeta[] = [
  { id: 'yellow_moong', label: 'Yellow Moong Dal', nameEn: 'Yellow Moong Dal', nameHi: 'पीली मूँग दाल' },
  { id: 'rajma', label: 'Rajma', nameEn: 'Kidney Beans (Rajma)', nameHi: 'राजमा' },
  { id: 'kabuli_chana', label: 'Kabuli Chana (Chhole)', nameEn: 'Chickpeas (Chhole)', nameHi: 'काबुली चना (छोले)' },
  { id: 'kala_chana', label: 'Kala Chana', nameEn: 'Black Chickpeas', nameHi: 'काला चना' },
  { id: 'besan', label: 'Besan (Gram Flour)', nameEn: 'Gram Flour (Besan)', nameHi: 'बेसन' },
  { id: 'soya_chunks', label: 'Soya Chunks / Nutri', nameEn: 'Soya Chunks', nameHi: 'सोया चंक्स' },
  { id: 'dahi', label: 'Curd / Dahi', nameEn: 'Curd / Yogurt', nameHi: 'दही' },
  { id: 'atta', label: 'Wheat Atta', nameEn: 'Wheat Flour', nameHi: 'गेहूँ का आटा' },
  { id: 'poha', label: 'Poha', nameEn: 'Flattened Rice (Poha)', nameHi: 'पोहा' },
  { id: 'suji', label: 'Suji / Rava', nameEn: 'Semolina (Suji)', nameHi: 'सूजी' },
  { id: 'oats', label: 'Oats', nameEn: 'Rolled Oats', nameHi: 'ओट्स' },
  { id: 'lobia', label: 'Lobia', nameEn: 'Black-Eyed Peas (Lobia)', nameHi: 'लोबिया' },
  { id: 'red_masoor', label: 'Masoor Dal', nameEn: 'Red Lentils (Masoor Dal)', nameHi: 'मसूर दाल' },
  { id: 'toor_dal', label: 'Toor Dal', nameEn: 'Pigeon Pea (Toor Dal)', nameHi: 'तूर दाल' },
  { id: 'urad_sabut', label: 'Urad Sabut (Black Lentils)', nameEn: 'Black Lentils (Urad Sabut)', nameHi: 'साबुत उड़द दाल' },
];

const CUSTOM_PANTRY_STORAGE_KEY = 'grub2day_custom_pantry_items';

export function getCustomPantryItems(): PantryItemMeta[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PANTRY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPantryItem(item: PantryItemMeta): void {
  try {
    const existing = getCustomPantryItems();
    const filtered = existing.filter(i => i.id !== item.id);
    filtered.push(item);
    localStorage.setItem(CUSTOM_PANTRY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save custom pantry item', e);
  }
}

export function inferIconAndHindi(rawName: string): { icon: string; nameEn: string; nameHi: string; category: 'veggie' | 'staple' } {
  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  const iconMap: Record<string, string> = {
    mushroom: '🍄',
    mushrooms: '🍄',
    broccoli: '🥦',
    corn: '🌽',
    'sweet corn': '🌽',
    tofu: '🧈',
    soya: '🌱',
    soy: '🌱',
    cucumber: '🥒',
    kheera: '🥒',
    beetroot: '🍠',
    chukandar: '🍠',
    garlic: '🧄',
    lehsun: '🧄',
    ginger: '🫚',
    adrak: '🫚',
    lemon: '🍋',
    nimbu: '🍋',
    chilli: '🌶️',
    mirch: '🌶️',
    beans: '🫘',
    cabbage: '🥬',
    patta_gobhi: '🥬',
    zucchini: '🥒',
    capsicum: '🫑',
    papaya: '🥭',
    peas: '🫛',
    curd: '🥛',
    dahi: '🥛',
    yogurt: '🥛',
    cheese: '🧀',
    butter: '🧈',
    makhan: '🧈',
    bread: '🍞',
    rice: '🍚',
    chawal: '🍚',
    pasta: '🍝',
    oats: '🌾',
    quinoa: '🌾',
    avocado: '🥑',
    spinach: '🥬',
    palak: '🥬',
    methi: '🌿',
    coriander: '🌿',
    dhania: '🌿',
    mint: '🌿',
    pudina: '🌿',
    egg: '🥚',
    eggs: '🥚',
    paneer: '🧀',
    millet: '🌾',
    bajra: '🌾',
    jowar: '🌾',
    ragi: '🌾',
    sattu: '🌾',
    coconut: '🥥',
  };

  const hiMap: Record<string, string> = {
    mushroom: 'मशरूम',
    mushrooms: 'मशरूम',
    broccoli: 'ब्रोकोली',
    corn: 'मक्का (कॉर्न)',
    'sweet corn': 'स्वीट कॉर्न',
    tofu: 'टोफू',
    cucumber: 'खीरा',
    kheera: 'खीरा',
    beetroot: 'चुकंदर',
    chukandar: 'चुकंदर',
    garlic: 'लहसुन',
    ginger: 'अदरक',
    lemon: 'नींबू',
    cabbage: 'पत्ता गोभी',
    zucchini: 'ज़ुचिनी',
    beans: 'बीन्स / फलियां',
    cheese: 'चीज़',
    butter: 'मक्खन',
    bread: 'ब्रेड',
    rice: 'चावल',
    pasta: 'पास्ता',
    oats: 'ओट्स',
    quinoa: 'क्विनोआ',
    avocado: 'एवोकैडो',
    mint: 'पुदीना',
    coriander: 'धनिया',
    ragi: 'रागी',
    bajra: 'बाजरा',
    jowar: 'ज्वार',
    millet: 'बाजरा / मिलेट',
    coconut: 'नारियल',
  };

  let icon = '🥗';
  for (const [key, ic] of Object.entries(iconMap)) {
    if (lower.includes(key)) {
      icon = ic;
      break;
    }
  }

  const isStaple = lower.includes('dal') || lower.includes('rice') || lower.includes('flour') || lower.includes('atta') || lower.includes('oats') || lower.includes('chawal') || lower.includes('grain');

  const nameEn = clean.charAt(0).toUpperCase() + clean.slice(1);
  const nameHi = hiMap[lower] || clean;

  return {
    icon,
    nameEn,
    nameHi,
    category: isStaple ? 'staple' : 'veggie',
  };
}

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

/**
 * Returns a clean, human-friendly ingredient name with icon strictly in the given language.
 */
export function getFriendlyIngredientName(id: string, language: 'en' | 'hi' = 'en'): string {
  const clean = id.toLowerCase().trim();
  const v = STANDARD_VEGGIES.find(item => item.id.toLowerCase() === clean);
  if (v) {
    const name = language === 'hi' ? v.nameHi : v.nameEn;
    return `${name} ${v.icon}`;
  }
  const s = STANDARD_STAPLES.find(item => item.id.toLowerCase() === clean);
  if (s) {
    const name = language === 'hi' ? s.nameHi : s.nameEn;
    return `${name} 🌾`;
  }
  const c = getCustomPantryItems().find(item => item.id.toLowerCase() === clean);
  if (c) {
    const name = language === 'hi' ? c.nameHi : c.nameEn;
    return `${name} ${c.icon}`;
  }

  const enMap: Record<string, string> = {
    eggs: 'Eggs 🥚',
    milk: 'Milk 🥛',
    curd: 'Curd / Yogurt 🥛',
    dahi: 'Curd / Yogurt 🥛',
    bread: 'Bread 🍞',
    rice: 'Rice 🍚',
    sev: 'Sev 🍜',
    coconut: 'Coconut 🥥',
    coconut_milk: 'Coconut Milk 🥥',
    sattu: 'Sattu Flour 🌾',
    multigrain_atta: 'Multigrain Flour 🌾',
    rice_flour: 'Rice Flour 🌾',
    whole_green_moong: 'Whole Moong 🌾',
    white_peas: 'White Peas 🫛',
    moth_beans_sprouts: 'Sprouts 🌱',
    paneer: 'Paneer 🧀',
    green_chilli: 'Green Chilli 🌶️',
    ginger: 'Ginger 🫚',
    garlic: 'Garlic 🧄',
    coriander: 'Fresh Coriander 🌿',
    jeera: 'Cumin 🌾',
    ajwain: 'Carom Seeds 🌾',
    anardana: 'Pomegranate Seeds 🌾',
    tea_bag: 'Tea Bag 🍵',
    ghee: 'Ghee 🧈',
    kasuri_methi: 'Dry Fenugreek 🌿',
  };

  const hiMap: Record<string, string> = {
    eggs: 'अंडे 🥚',
    milk: 'दूध 🥛',
    curd: 'दही 🥛',
    dahi: 'दही 🥛',
    bread: 'ब्रेड 🍞',
    rice: 'चावल 🍚',
    sev: 'सेव 🍜',
    coconut: 'नारियल 🥥',
    coconut_milk: 'नारियल का दूध 🥥',
    sattu: 'सत्तू 🌾',
    multigrain_atta: 'मल्टीग्रेन आटा 🌾',
    rice_flour: 'चावल का आटा 🌾',
    whole_green_moong: 'साबुत मूँग 🌾',
    white_peas: 'सफ़ेद मटर 🫛',
    moth_beans_sprouts: 'अंकुरित मूँग/चना 🌱',
    paneer: 'पनीर 🧀',
    green_chilli: 'हरी मिर्च 🌶️',
    ginger: 'अदरक 🫚',
    garlic: 'लहसुन 🧄',
    coriander: 'ताज़ा धनिया 🌿',
    jeera: 'जीरा 🌾',
    ajwain: 'अजवाइन 🌾',
    anardana: 'अनारदाना 🌾',
    tea_bag: 'चाय पत्ती 🍵',
    ghee: 'देसी घी 🧈',
    kasuri_methi: 'कसूरी मेथी 🌿',
  };

  const map = language === 'hi' ? hiMap : enMap;
  if (map[clean]) return map[clean];
  return clean.replace(/_/g, ' ');
}

/**
 * Calculates human-friendly missing ingredients for a recipe given current pantry.
 */
export function getMissingIngredientsForRecipe(
  recipe: Recipe, 
  pantry: PantryState,
  language: 'en' | 'hi' = 'en'
): string[] {
  const availableSet = new Set<string>([
    ...pantry.availableVeggies.map(v => v.toLowerCase()),
    ...pantry.staplesInStock.map(s => s.toLowerCase()),
    'ghee', 'oil', 'jeera', 'garlic', 'ginger', 'hing', 'turmeric', 
    'coriander', 'salt', 'lemon', 'bread', 'rice', 'milk'
  ]);

  return recipe.mainIngredients
    .filter(ing => !availableSet.has(ing.toLowerCase()))
    .map(ing => getFriendlyIngredientName(ing, language));
}

/**
 * Suggests delicious, popular Pan-Indian recipes for a meal slot that require
 * items currently NOT in the fridge, so the user never misses out on good food!
 */
export function getInspirationRecipes(
  slot: string,
  allRecipes: Recipe[],
  pantry: PantryState,
  currentRecipeId?: string | null,
  excludeIds?: Set<string>,
  language: 'en' | 'hi' = 'en'
): { recipe: Recipe; missingIngredients: string[] }[] {
  const candidates = allRecipes.filter(r => 
    r.suitableSlots.includes(slot as any) &&
    r.id !== currentRecipeId &&
    (!excludeIds || !excludeIds.has(r.id))
  );

  // We want dishes that CANNOT be made from the fridge right now (missing core ingredients)
  const missingCore = candidates.filter(r => !hasRequiredCoreIngredients(r, pantry));
  const pool = missingCore.length > 0 ? missingCore : candidates;

  return pool.map(recipe => ({
    recipe,
    missingIngredients: getMissingIngredientsForRecipe(recipe, pantry, language)
  })).sort((a, b) => {
    // Sort by high protein first
    const protA = a.recipe.baseProteinGrams + a.recipe.addedProteinGrams;
    const protB = b.recipe.baseProteinGrams + b.recipe.addedProteinGrams;
    return protB - protA;
  });
}
