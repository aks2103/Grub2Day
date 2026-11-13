// ==============================================================================
// Grub2Day — Catchy Desi Foodie Lines & Witty Quotes
// ==============================================================================

export interface FoodieQuote {
  quote: string;
  author: string;
  emoji: string;
}

export const CATCHY_FOODIE_LINES: FoodieQuote[] = [
  {
    quote: "No more 'Aap hi batao aaj kya banayein?' — Decision sorted in 1 tap!",
    author: "Wife's Mental Peace Society",
    emoji: "🧘‍♀️"
  },
  {
    quote: "6 Din Tak No Repeat — Tongue bhi khush, Tummy bhi mast!",
    author: "Desi Tastebuds Rulebook",
    emoji: "😋"
  },
  {
    quote: "Ghar ka khana, maa jaisa swaad, aur protein ekdum dandaas! 💪",
    author: "Desi Recomp Mantra",
    emoji: "🍲"
  },
  {
    quote: "Dono bachhe so gaye? Chalo shaanti se dinner enjoy karte hain! 🤫",
    author: "Parenting Milestone #1",
    emoji: "👶🍼"
  },
  {
    quote: "Dal-Chawal or Rajma-Rice? Ek chammach desi ghee fixes everything.",
    author: "North Indian Wisdom",
    emoji: "🍛"
  },
  {
    quote: "Belly fat ghatao, muscle banao — par Garam Roti mat chodo!",
    author: "Fitness Without Torture",
    emoji: "🔥"
  },
  {
    quote: "Fridge mein jo hai, usi se swaad ka jaadu chalega!",
    author: "Smart Kitchen Hacker",
    emoji: "🪄"
  },
  {
    quote: "Aaj dinner bahar? One tap karo aur wife ko kitchen se chutti do!",
    author: "Husband of the Year",
    emoji: "🍕"
  },
  {
    quote: "Paneer, Eggs aur Dahi — Indian vegetarian protein ke asli heroes!",
    author: "Macros Master",
    emoji: "🧀"
  },
  {
    quote: "Family meal ek hi banegi — gym waale protein ke liye 2 boiled eggs kaafi hain!",
    author: "Realistic Fitness Rule",
    emoji: "🥚"
  }
];

export function getRandomQuote(): FoodieQuote {
  const index = Math.floor(Math.random() * CATCHY_FOODIE_LINES.length);
  return CATCHY_FOODIE_LINES[index];
}
