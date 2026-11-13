# 🍲 Grub2Day — Ghar Ka Khana, Zero Bahana!

> A lightweight, mobile-first North Indian meal planner designed to run on personal iPhones as an installable Progressive Web App (PWA). Solves the daily *"What should I cook today?"* fatigue for your family with zero hassle, a strict **6-Day Anti-Repetition Cooldown**, fridge-aware suggestions, and a balanced **110–125g protein** target for body recomposition.

---

## ✨ Features Built for Your Family

- **🍽️ Daily Menu at a Glance**: Breakfast, Lunch, and Dinner suggestions every day based on authentic North Indian home-style cooking.
- **⏱️ 6-Day Anti-Repetition Engine**: Marking a dish *"Cooked This!"* starts a 6-day cooldown timer. The app never suggests the same dal, sabzi, or specialty breakfast within a 6-day rolling window.
- **🧊 Fridge & Pantry Matching**: Check off vegetables you have in the fridge (Bhindi, Palak, Paneer, Lauki, Gobhi, Eggs, etc.). The app dynamically prioritizes recipes that use what you already have at home.
- **🔄 1-Tap "Swap Dish"**: If your wife isn't in the mood to make what's scheduled, one tap shows 5 alternative dishes that respect the 6-day cooldown and match available ingredients.
- **🍕 1-Tap "Dining Out Tonight"**: Since non-veg (chicken/fish) is eaten when dining out at restaurants, tapping this logs dinner as dining out so your wife doesn't need to cook and your nutrition tracker stays accurate.
- **👶 Kid & Toddler Prep Notes**: Every single dish includes a practical note on how to make a mild, toddler-friendly version for children under 4 before adding heavy spices.
- **💪 Husband Protein Booster**: 1-tap reminders for Alok's body recomposition (36M, 78kg, 180cm) to effortlessly hit 110–125g protein by adding 2 boiled eggs, spiced paneer cubes, thick curd, or roasted chana without cooking two separate meals.
- **📖 60+ Authentic North Indian Recipe Bank**: Pre-loaded with Dals, Rajma/Chhole, Paneer specialties, dry sabzis, gravy curries, cheelas, and parathas, with full support to add custom family recipes.
- **😄 Catchy Desi Humor & Quotes**: Rotating witty quotes like *"No more 'Aap hi batao aaj kya banayein?'"* and *"Ghar ka swaad, protein dandaas!"*.

---

## 🏗️ Architecture & NoSQL Database

The application follows a clean, modular repository pattern:

- **Local NoSQL Engine (`src/db/localNoSqlDb.ts`)**: Fast, persistent document/collection store (`recipes`, `meals`, `pantry`, `settings`) with reactive subscription events.
- **Cloud Firestore Adapter (`src/db/firestoreDb.ts`)**: Pre-built adapter adhering to `IDatabaseProvider`. When you're ready to connect to Google Cloud Firestore, simply switch `VITE_DB_TYPE="firestore"` in `.env`.
- **Environment Driven (`.env`)**: All credentials, targets, and household settings live in `.env`.

---

## 📱 How to Run on Your Personal iPhone (Zero App Store Publishing Needed)

### 1. Start the Dev Server
Make sure your iPhone and your Mac are on the same Wi-Fi network:

```bash
npm install
npm run dev
```

The terminal will display your local network URL:
```
➜  Network: http://192.168.x.x:3000/
```

### 2. Add to iPhone Home Screen
1. Open **Safari** on your iPhone.
2. Enter the network URL (e.g. `http://192.168.1.5:3000`).
3. Tap the **Share button** (square with an arrow pointing up at the bottom of Safari).
4. Scroll down and tap **"Add to Home Screen"** (`+`).
5. Tap **Add**.

🎉 **Grub2Day** will now appear on your iPhone home screen with its custom app icon, launching fullscreen without Safari URL bars just like a native iOS app!

---

## 🛠️ Project Structure

```
├── .env                  # Local variables & config (git ignored)
├── .env.example          # Template with documentation
├── public/
│   ├── favicon.svg       # Foodie vector icon
│   └── manifest.json     # Web app manifest for iOS PWA installation
├── src/
│   ├── config/           # Environment and app target wrappers
│   ├── data/
│   │   ├── seedRecipes.ts # 60+ authentic North Indian recipes
│   │   └── quotes.ts     # Catchy desi foodie quotes bank
│   ├── db/
│   │   ├── dbInterface.ts # NoSQL Database interface
│   │   ├── localNoSqlDb.ts# Local document/collection NoSQL store
│   │   ├── firestoreDb.ts # Cloud Firestore provider skeleton
│   │   └── index.ts       # Database factory
│   ├── services/
│   │   ├── cooldownService.ts   # 6-Day anti-repetition engine
│   │   ├── pantryService.ts     # Fridge inventory match & ranking
│   │   ├── nutritionService.ts  # Daily protein & calorie tracker
│   │   └── mealPlannerService.ts# Plan generator & swap orchestrator
│   ├── components/       # Clean, modular UI components (Pure white bg)
│   ├── App.tsx           # Main application coordinator
│   └── main.tsx          # Application entrypoint
```

---

## 🚀 Building for Production

```bash
npm run build
```

Build output is written to `dist/` (ultra lightweight: ~68 kB gzip JS).
