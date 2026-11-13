// ==============================================================================
// Grub2Day — Cooking Instructions & YouTube Video Service
// Provides step-by-step cooking guide and direct deep-links to YouTube app
// ==============================================================================

import { Recipe } from '../types';

export interface CookingDetails {
  ingredients: string[];
  steps: string[];
  chefTip: string;
  youtubeUrl: string;
  youtubeAppUrl: string;
  searchQuery: string;
}

export function getCookingDetails(recipe: Recipe): CookingDetails {
  const query = `${recipe.name} authentic Indian recipe`;
  const encodedQuery = encodeURIComponent(query);
  
  // Standard HTTPS YouTube URL triggers iOS Universal Links directly into YouTube App
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
  const youtubeAppUrl = `youtube://www.youtube.com/results?search_query=${encodedQuery}`;

  // If recipe already has custom steps, use them
  if (recipe.cookingSteps && recipe.cookingSteps.length > 0) {
    return {
      ingredients: recipe.ingredientDetails || recipe.mainIngredients.map(i => i.replace(/_/g, ' ')),
      steps: recipe.cookingSteps,
      chefTip: recipe.kidFriendlyTip,
      youtubeUrl,
      youtubeAppUrl,
      searchQuery: query,
    };
  }

  // Generate clear, authentic 4-step home cooking method
  const steps: string[] = [];
  const ingredients: string[] = recipe.mainIngredients.map(i => {
    const formatted = i.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  });

  if (recipe.category === 'dal' || recipe.category === 'legume') {
    steps.push('Soak lentils/legumes for 30–60 mins (or overnight for Rajma/Chana). Pressure cook with water, salt, and turmeric until soft.');
    steps.push('Heat ghee in a pan. Splutter cumin seeds, add chopped onions, and ginger-garlic paste. Sauté until golden brown.');
    steps.push('Add tomato puree and everyday spices (coriander, red chilli, garam masala). Cook until oil/ghee separates.');
    steps.push('Pour in the cooked lentils. Simmer for 8–10 minutes on low heat. Garnish with fresh coriander leaves.');
  } else if (recipe.category === 'paneer') {
    steps.push('Cube the paneer. (Optional: Soak in warm water for 5 mins for extra softness).');
    steps.push('Heat ghee/oil in a kadai. Sauté whole spices, onions, and ginger-garlic until fragrant.');
    steps.push('Add tomato-cashew puree or pureed spinach, cooking until the masala is rich and aromatic.');
    steps.push('Gently fold in the paneer cubes. Simmer for 3–5 minutes (do not overcook paneer). Finish with kasuri methi.');
  } else if (recipe.category === 'dry_sabzi') {
    steps.push('Wash, dry thoroughly, and chop the vegetables into uniform pieces.');
    steps.push('Heat mustard oil or ghee. Add ajwain/cumin, hing, and green chillies.');
    steps.push('Add the vegetables, turmeric, and salt. Cook uncovered on medium-high to get crisp edges.');
    steps.push('Finish with dry mango powder (amchur), garam masala, and fresh coriander. Serve hot with phulkas.');
  } else if (recipe.category === 'egg_breakfast') {
    steps.push('Whisk eggs with a pinch of salt and black pepper (or boil eggs for 9 mins for hard boiled).');
    steps.push('Sauté finely chopped onions, tomatoes, and green chillies in a hot pan with a touch of butter/oil.');
    steps.push('Add the eggs into the pan on medium heat, stirring gently until soft scrambled (bhurji) or pour into gravy.');
    steps.push('Garnish with chopped coriander and serve hot with toasted bread or soft warm phulkas.');
  } else {
    steps.push('Prepare the batter or dough with fresh ingredients.');
    steps.push('Heat a heavy tawa/pan on medium heat. Brush lightly with ghee.');
    steps.push('Cook on both sides until golden-brown and fragrant.');
    steps.push('Serve hot with fresh mint chutney, sweet curd, or piping hot sambar.');
  }

  return {
    ingredients,
    steps,
    chefTip: recipe.kidFriendlyTip,
    youtubeUrl,
    youtubeAppUrl,
    searchQuery: query,
  };
}
