// ==============================================================================
// Grub2Day — Cooking Instructions & YouTube Video Service
// Provides step-by-step cooking guide and direct deep-links to YouTube app
// ==============================================================================

import { Recipe } from '../types';
import { getFriendlyIngredientName } from './pantryService';

export interface CookingDetails {
  ingredients: string[];
  steps: string[];
  chefTip: string;
  youtubeUrl: string;
  youtubeAppUrl: string;
  searchQuery: string;
}

export function getCookingDetails(recipe: Recipe, language: 'en' | 'hi' = 'en'): CookingDetails {
  const query = language === 'hi'
    ? `${recipe.hindiName || recipe.name} रेसिपी`
    : `${recipe.name} authentic Indian recipe`;
  const encodedQuery = encodeURIComponent(query);
  
  // Standard HTTPS YouTube URL triggers iOS Universal Links directly into YouTube App
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
  const youtubeAppUrl = `youtube://www.youtube.com/results?search_query=${encodedQuery}`;

  const ingredients: string[] = recipe.mainIngredients.map(i => {
    return getFriendlyIngredientName(i, language);
  });

  const steps: string[] = [];

  if (language === 'hi') {
    if (recipe.category === 'dal' || recipe.category === 'legume') {
      steps.push('दाल या राजमा/छोले को 30-60 मिनट (या रात भर) भिगोएं। कुकर में पानी, नमक और हल्दी डालकर 4-5 सीटी आने तक उबालें।');
      steps.push('कड़ाही में शुद्ध देसी घी गर्म करें। जीरा, हींग, बारीक कटा प्याज़ और अदरक-लहसुन का पेस्ट डालकर सुनहरा होने तक भूनें।');
      steps.push('टमाटर प्यूरी और रोज़मर्रा के मसाले (धनिया, लाल मिर्च, गरम मसाला) डालकर घी छूटने तक पकाएं।');
      steps.push('उबली हुई दाल डालें। धीमी आंच पर 8-10 मिनट तक पकने दें और ताज़े हरे धनिये से सजाकर गरमा-गरम परोसें।');
    } else if (recipe.category === 'paneer') {
      steps.push('पनीर के चौकोर टुकड़े काटें (अधिक मुलायम रखने के लिए 5 मिनट गुनगुने पानी में रखें)।');
      steps.push('कड़ाही में घी या तेल गर्म करें। खड़े मसाले, प्याज़ और अदरक-लहसुन डालकर सुगंध आने तक भूनें।');
      steps.push('टमाटर-काजू का पेस्ट या पालक प्यूरी डालकर मसाले को अच्छे से भून लें।');
      steps.push('पनीर के टुकड़े डालें और धीमी आंच पर 3-5 मिनट पकाएं। ऊपर से कसूरी मेथी और मलाई डालकर परोसें।');
    } else if (recipe.category === 'dry_sabzi') {
      steps.push('ताज़ी सब्ज़ियों को अच्छी तरह धोकर सुखाएं और एक समान टुकड़ों में काट लें।');
      steps.push('कड़ाही में सरसों का तेल या घी गर्म करें। अजवाइन/जीरा, हींग और हरी मिर्च का तड़का लगाएं।');
      steps.push('सब्ज़ियाँ, हल्दी और स्वादानुसार नमक डालकर मध्यम आंच पर कुरकुरा होने तक पकाएं।');
      steps.push('ऊपर से अमचूर पाउडर, गरम मसाला और हरा धनिया डालकर गरमा-गरम फुल्कों के साथ परोसें।');
    } else if (recipe.category === 'egg_breakfast') {
      steps.push('अंडों को एक चुटकी नमक और काली मिर्च डालकर अच्छे से फेंट लें।');
      steps.push('पैन में मक्खन या घी गर्म करें और बारीक कटा प्याज़, टमाटर व हरी मिर्च भूनें।');
      steps.push('फेंटे हुए अंडे डालकर धीमी आंच पर हल्के हाथों से चलाते हुए मुलायम भुर्जी तैयार करें।');
      steps.push('हरा धनिया डालकर गरमा-गरम टोस्ट या पराठे के साथ परोसें।');
    } else {
      steps.push('ताज़ी सामग्री के साथ घोल या आटा तैयार करें।');
      steps.push('भारी तले के तवे को मध्यम आंच पर गर्म करें और थोड़ा देसी घी लगाएं।');
      steps.push('दोनों तरफ से सुनहरा और कुरकुरा होने तक अच्छी तरह सेकें।');
      steps.push('ताज़ी हरी चटनी, मीठे दही या सांभर के साथ गरमा-गरम परोसें।');
    }

    return {
      ingredients,
      steps,
      chefTip: 'बच्चों के लिए तीखा मसाला मिलाने से पहले एक हिस्सा अलग निकाल लें।',
      youtubeUrl,
      youtubeAppUrl,
      searchQuery: query,
    };
  }

  // English Steps
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
