// ==============================================================================
// Grub2Day — Gemini AI Cooking & Emotional Culinary Insight Service
// Deeply connects the emotion of cooking, warmth of ghar ka khana, and smart swaps
// ==============================================================================

import { GoogleGenAI } from '@google/genai';
import { Recipe, MealSlot } from '../types';
import { APP_CONFIG } from '../config/env';

export interface EmotionalCulinaryInsight {
  whyThis: string;
  tryThisTwist: string;
  emotionalTag: string;
  toddlerCare: string;
  alokProteinNote: string;
}

// Curated authentic culinary insights bank for instantaneous emotional grounding
const CURATED_EMOTIONAL_INSIGHTS: Record<string, Partial<EmotionalCulinaryInsight>> = {
  'b-1': { // Anda Bhurji
    emotionalTag: 'Comforting Sunday Morning Warmth 🍳',
    whyThis: 'Quick, high in bioavailable protein, and fills the house with the comforting aroma of browned onions and desi jeera.',
    tryThisTwist: 'Beat a teaspoon of fresh milk into the eggs before pouring on the tawa — it makes the bhurji wonderfully soft and melt-in-mouth.',
  },
  'b-2': { // Paneer Bhurji
    emotionalTag: 'Maa Ke Haath Ka Swaad 🧀',
    whyThis: 'Soft, creamy paneer with warm rotis is pure comfort food that toddler and parents both look forward to on busy mornings.',
    tryThisTwist: 'Crush a pinch of kasuri methi between your palms right at the end to give it that unforgettable dhaba touch.',
  },
  'b-3': { // Moong Dal Cheela
    emotionalTag: 'Light, Golden & Wholesome ✨',
    whyThis: 'Gentle on digestion, packed with clean plant protein, and crisp golden edges that make healthy eating genuinely satisfying.',
    tryThisTwist: 'Stuff with grated paneer and chopped fresh coriander for a rich, filling bite without feeling heavy.',
  },
  'd-1': { // Rajma Masala
    emotionalTag: 'Dilli Ka Pyaar & Sunday Nostalgia 🍛',
    whyThis: 'Nothing unites a North Indian family like Rajma-Chawal. Rich, slow-simmered warmth that heals the week’s exhaustion.',
    tryThisTwist: 'Gently mash a small cup of boiled rajma against the pot with a ladle to make the gravy thick, velvety, and naturally silky.',
  },
  'd-2': { // Pindi Chhole
    emotionalTag: 'Amritsari Street Soul 🫓',
    whyThis: 'Dark, tangy, and deeply aromatic. A powerhouse of fiber and steady energy that keeps everyone satisfied for hours.',
    tryThisTwist: 'A hint of anardana (dried pomegranate) and kasuri methi gives that authentic dark tang without needing excess tomatoes.',
  },
  'd-3': { // Yellow Moong Dal Tadka
    emotionalTag: 'Peace In A Katori 🕊️',
    whyThis: 'The most forgiving, soothing meal on earth. Soothing for tired stomachs, easy on the toddler, and pure comfort after a long day.',
    tryThisTwist: 'Finish with a smoking ghee-hing tadka poured with a sizzle right before serving at the dinner table.',
  },
  'p-1': { // Palak Paneer
    emotionalTag: 'Vibrant Green Nourishment 🌿',
    whyThis: 'Iron-rich spinach hugging soft cubes of paneer. It balances indulgence with pure clean nutrition for the whole family.',
    tryThisTwist: 'Do not overcook the spinach puree; keep the lid off so it retains its vibrant emerald green color and fresh sweet taste.',
  },
  's-1': { // Kurkuri Bhindi Masala
    emotionalTag: 'Crispy Joy & Toddler Smiles 🥒',
    whyThis: 'Light, crisp, and fun. After a heavy legume meal yesterday, crunchy bhindi with warm rotis feels like a welcome breath of fresh air.',
    tryThisTwist: 'Toss with a pinch of amchur (dry mango powder) right at the end to keep the ladyfingers non-slimy and deliciously crisp.',
  },
  's-2': { // Aloo Gobhi
    emotionalTag: 'Everyday Ghar Ki Rasoi Staple 🏡',
    whyThis: 'The quintessential aroma of winter afternoons. Humble, fragrant with julienned ginger, and deeply grounding.',
    tryThisTwist: 'Cook the cauliflower on medium-high without water so the edges get lightly caramelized and nutty.',
  },
  's-3': { // Baingan Bharta
    emotionalTag: 'Smoky Fire-Roasted Nostalgia 🔥',
    whyThis: 'Direct flame-roasting gives that deep smoky soul that cannot be bought in any restaurant. Pure rustic comfort.',
    tryThisTwist: 'Slit garlic cloves right inside the raw eggplant before roasting over the flame — the garlic roasts to buttery perfection inside!',
  },
};

export async function getEmotionalInsight(
  recipe: Recipe,
  slot: MealSlot,
  dayContext?: { yesterdayMealName?: string; isDiningOutUpcoming?: boolean }
): Promise<EmotionalCulinaryInsight> {
  const curated = CURATED_EMOTIONAL_INSIGHTS[recipe.id];

  const defaultInsight: EmotionalCulinaryInsight = {
    emotionalTag: curated?.emotionalTag || 'Nourishing Ghar Ka Khana 🍲',
    whyThis: curated?.whyThis || `Balanced North Indian home comfort. Light on the stomach, nutrient-dense, and cooked with love for the whole household.`,
    tryThisTwist: curated?.tryThisTwist || `Finish with freshly chopped coriander leaves and a few drops of lemon juice for instant freshness.`,
    toddlerCare: recipe.kidFriendlyTip,
    alokProteinNote: recipe.husbandProteinBooster,
  };

  // If user configured Gemini API key, we can augment with live AI nuance
  if (APP_CONFIG.geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: APP_CONFIG.geminiApiKey });
      const prompt = `You are a warm, loving, experienced North Indian home chef and nutrition advisor helping a family of 4 (Dad: 36M 78kg looking for protein/recomp, Mom cooking, 2 toddlers under 4 and infant under 6 months).
The meal chosen for ${slot} is: "${recipe.name}" (${recipe.hindiName || ''}).
Ingredients: ${recipe.mainIngredients.join(', ')}.
${dayContext?.yesterdayMealName ? `Yesterday's meal was: ${dayContext.yesterdayMealName}.` : ''}

Write a short, emotionally heartwarming response in JSON format with:
{
  "whyThis": "1 warm sentence on why this dish is emotionally and physically perfect for today's table",
  "tryThisTwist": "1 quick chef trick (30 seconds) that elevates taste without complicating cooking",
  "emotionalTag": "A 3-5 word poetic/heartfelt badge with emoji",
  "toddlerCare": "1 short practical tip for the toddler/baby",
  "alokProteinNote": "1 short effortless tip for dad's protein"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        whyThis: parsed.whyThis || defaultInsight.whyThis,
        tryThisTwist: parsed.tryThisTwist || defaultInsight.tryThisTwist,
        emotionalTag: parsed.emotionalTag || defaultInsight.emotionalTag,
        toddlerCare: parsed.toddlerCare || defaultInsight.toddlerCare,
        alokProteinNote: parsed.alokProteinNote || defaultInsight.alokProteinNote,
      };
    } catch (err) {
      console.warn("Gemini AI API call fell back to curated culinary wisdom:", err);
      return defaultInsight;
    }
  }

  return defaultInsight;
}

export async function askGeminiChef(userQuestion: string, currentMealName: string): Promise<string> {
  if (!APP_CONFIG.geminiApiKey) {
    return `Chef's Tip for ${currentMealName}: Keep your cooking joyful and simple. A dash of roasted jeera or a bowl of fresh dahi on the side makes any meal wholesome! (Add your VITE_GEMINI_API_KEY in .env to unlock live interactive Gemini queries).`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: APP_CONFIG.geminiApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a loving North Indian home chef advising a busy mother with 2 young kids and a husband aiming for high protein.
Current dish: ${currentMealName}.
Question: "${userQuestion}".
Answer concisely in 2-3 warm, encouraging sentences in English with warm Hindi culinary terms.`,
    });
    return response.text || "Cook with a smile, that's the best secret spice!";
  } catch (err) {
    return "Keep spices mild for the little ones and enjoy every bite!";
  }
}
