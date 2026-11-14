// ==============================================================================
// Grub2Day — Multi-language Localization Dictionary (English & Hindi)
// 100% strict language separation: No English when in Hindi, No Hindi when in English
// ==============================================================================

export type AppLanguage = 'en' | 'hi';

export const TRANSLATIONS = {
  en: {
    appName: "Grub2Day",
    subtitle: "Fresh Home Meals, Zero Monotony",
    today: "Today",
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    daysLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    todayFamilyMeals: "Today's Family Meals",
    cookedWithLove: "Cooked with love, zero mental fatigue in the kitchen!",
    dayOfCycle: (day: number) => `Day ${day} of 6 • Guaranteed zero duplicate dishes.`,
    
    // View Switcher (Source)
    inFridge: "In Fridge",
    foodInspiration: "Food Inspiration",
    
    // Meal Slots
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    
    // Slot status badges
    cookedBadge: "Cooked",
    cravingBadge: "Craving",
    diningOutBadge: "Dining Out",
    inspirationBadge: "Inspiration",
    
    // Meal Card details
    forTheKids: "For the Kids",
    proteinBoost: "Protein Boost",
    needToGet: "Need to get",
    proteinUnit: "g Protein",
    proteinShort: "g",
    minsUnit: "mins",
    minsShort: "m",
    
    // Meal Card Actions
    howToCook: "How to Cook 🍳",
    swapDish: "Swap Dish",
    cookedThis: "Cooked This!",
    markedAsCooked: "Marked as Cooked ✓",
    cravingButton: "Craving?",
    markedCraving: "Craving ❤️",
    shareDish: "Share Dish",
    diningOutPrompt: "Dining out tonight? Tap here",
    diningOutTitle: "Dining Out Tonight",
    kitchenOff: "Kitchen Off! ✨",
    resumeHomeCooking: "Decided to cook at home? Tap to restore meal",
    
    // Pagination & Navigation
    prevMeal: "Prev",
    nextMeal: "Next",
    swipeHint: "Swipe 👈 👉 to change meal",
    
    // Header
    fridgeBtn: "Fridge",
    profileTitle: "Household Profile & Settings",
    reloadTitle: "Reload & refresh site",
    langToggleTitle: "Switch to Hindi (हिंदी)",
    langToggleLabel: "EN",
    
    // Swap Sheet
    swapSheetTitle: (slotTitle: string) => `Swap ${slotTitle} Dish`,
    currently: "Currently",
    searchPlaceholder: "Search dishes or ingredients (e.g. paneer, dal, potato)...",
    allOptions: "All Options",
    allIndia: "All India 🇮🇳",
    north: "North",
    south: "South",
    west: "West",
    east: "East",
    pickDish: "Pick",
    noRecipesFound: "No matching recipes found.",
    
    // Pantry Sheet
    pantryTitle: "What's in the Kitchen & Fridge?",
    pantrySubtitle: "Tap what you have; the menu prioritizes recipes using your ingredients",
    applyBtn: "Apply",
    searchIngredientPlaceholder: "Type an ingredient (e.g. Mushroom, Paneer, Spinach)...",
    inFridgeCount: (count: number) => `${count} in Kitchen & Fridge`,
    emptyFridgeTitle: "Your fridge list is empty",
    emptyFridgeSubtitle: "Type an ingredient above or tap quick essentials below",
    addCustomItem: (name: string) => `Add "${name}" to my fridge`,
    quickEssentials: "Quick Essentials",
    clearAll: "Clear All",
    matchingResults: "Suggestions",
    freshVeggiesAndDairy: "Fresh Vegetables & Dairy",
    dalsAndStaples: "Dals, Legumes & Staples",
    selectedCount: "Selected",
    inStockCount: "In Stock",
    whatsAppSharingTitle: "Direct WhatsApp Sharing",
    whatsAppSharingSubtitle: "Send cravings & dish ideas straight to your partner",
    enabledBadge: "Enabled ✓",
    hiddenBadge: "Hidden (Craving Only)",
    savePhoneBtn: "Save Number",
    phoneSaved: "Saved ✓",
    whatsAppNotice: "WhatsApp button is removed from all cards. You will only see the clean Craving ❤️ button!",
    
    // How To Cook Modal
    howToCookTitle: "How to Cook",
    watchOnYouTube: "Watch on YouTube App 🎥",
    ingredientsTitle: "Key Ingredients & Pantry Items",
    stepsTitle: "Simple Step-by-Step Cooking Method",
    readyIn: "Ready in",
    
    // Regions
    regions: {
      north: "North Indian",
      south: "South Indian",
      west: "West Indian",
      east: "East Indian",
      chinese: "Desi Chinese",
      street_food: "Street Food",
    },
    chinese: "Chinese",
    streetFood: "Street Food",
    
    // WhatsApp template
    whatsappShare: (mealName: string, slotTitle: string, needStr: string, booster: string, url: string) =>
      `Hey! Craving *${mealName}* for ${slotTitle} today 😋❤️${needStr}\n\nProtein Boost: ${booster}\n\nCheck on Grub2Day: ${url}`,
      
    // Toasts
    swappedToast: (dishName: string) => `✨ Swapped to ${dishName}! 6-day cycle updated.`,
    cookedToast: "🍳 Cooked! 6-day cooldown active for this dish.",
    langSwitched: "🌐 Language set to English",
    cravingAdded: "❤️ Marked as your craving for today!",
    cravingCleared: "Craving cleared",
    diningOutToast: "🍕 Dining Out tonight! Kitchen is off.",
    fridgeSynced: "🧊 Menu updated based on your fridge items!",
    phoneSavedToast: "📱 Mobile number saved!",
    shuffledToast: "✨ Shuffled! Fresh dishes prepared for you.",
  },

  hi: {
    appName: "Grub2Day",
    subtitle: "घर का स्वाद, रोज़ नया स्वाद",
    today: "आज",
    daysShort: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    daysLong: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
    todayFamilyMeals: "आज का पारिवारिक भोजन",
    cookedWithLove: "स्वाद और सेहत से भरपूर, बिना किसी झंझट के!",
    dayOfCycle: (day: number) => `6 दिनों का चक्र • दिन ${day} • कोई दोहराव नहीं`,
    
    // View Switcher (Source)
    inFridge: "फ्रिज में उपलब्ध",
    foodInspiration: "खाने की प्रेरणा",
    
    // Meal Slots
    breakfast: "नाश्ता",
    lunch: "दोपहर का खाना",
    dinner: "रात का खाना",
    
    // Slot status badges
    cookedBadge: "बना लिया",
    cravingBadge: "पसंदीदा",
    diningOutBadge: "बाहर खाना",
    inspirationBadge: "प्रेरणा",
    
    // Meal Card details
    forTheKids: "बच्चों के लिए",
    proteinBoost: "प्रोटीन बूस्ट",
    needToGet: "सामग्री चाहिए",
    proteinUnit: "ग्रा प्रोटीन",
    proteinShort: "ग्रा",
    minsUnit: "मिनट",
    minsShort: "मि.",
    
    // Meal Card Actions
    howToCook: "पकाने की विधि 🍳",
    swapDish: "व्यंजन बदलें",
    cookedThis: "बना लिया!",
    markedAsCooked: "बनाया हुआ ✓",
    cravingButton: "पसंद है?",
    markedCraving: "पसंदीदा ❤️",
    shareDish: "साझा करें",
    diningOutPrompt: "आज रात बाहर खाना है? यहाँ दबाएँ",
    diningOutTitle: "आज रात बाहर खाना",
    kitchenOff: "आज रसोई की छुट्टी! ✨",
    resumeHomeCooking: "घर पर खाना बनाना है? वापस जोड़ें",
    
    // Pagination & Navigation
    prevMeal: "पिछला",
    nextMeal: "अगला",
    swipeHint: "स्वाइप करें 👈 👉 भोजन बदलने के लिए",
    
    // Header
    fridgeBtn: "रसोई/फ्रिज",
    profileTitle: "पारिवारिक प्रोफ़ाइल और सेटिंग्स",
    reloadTitle: "साइट पुनः लोड करें",
    langToggleTitle: "Switch to English",
    langToggleLabel: "HI",
    
    // Swap Sheet
    swapSheetTitle: (slotTitle: string) => `${slotTitle} का व्यंजन बदलें`,
    currently: "वर्तमान",
    searchPlaceholder: "व्यंजन या सामग्री खोजें (जैसे पनीर, दाल, आलू)...",
    allOptions: "सभी विकल्प",
    allIndia: "पूरा भारत 🇮🇳",
    north: "उत्तर",
    south: "दक्षिण",
    west: "पश्चिम",
    east: "पूर्व",
    pickDish: "चुनें",
    noRecipesFound: "कोई व्यंजन नहीं मिला।",
    
    // Pantry Sheet
    pantryTitle: "रसोई और फ्रिज में क्या है?",
    pantrySubtitle: "जो सामग्री आपके पास है उसे चुनें; मेनू उसी अनुसार तय होगा",
    applyBtn: "लागू करें",
    searchIngredientPlaceholder: "सामग्री का नाम लिखें (जैसे मशरूम, पनीर, पालक)...",
    inFridgeCount: (count: number) => `रसोई और फ्रिज में ${count} सामग्री`,
    emptyFridgeTitle: "आपकी फ्रिज लिस्ट खाली है",
    emptyFridgeSubtitle: "ऊपर सामग्री का नाम लिखें या नीचे मुख्य सामग्री पर टैप करें",
    addCustomItem: (name: string) => `"${name}" को फ्रिज में जोड़ें`,
    quickEssentials: "रोज़मर्रा की मुख्य सामग्री",
    clearAll: "सभी हटाएं",
    matchingResults: "सुझाव",
    freshVeggiesAndDairy: "ताज़ी सब्ज़ियाँ और डेयरी",
    dalsAndStaples: "दालें, अनाज और राशन",
    selectedCount: "चुनी गई",
    inStockCount: "उपलब्ध",
    whatsAppSharingTitle: "व्हाट्सएप पर सीधा संदेश",
    whatsAppSharingSubtitle: "अपनी पसंद का व्यंजन तुरंत अपने साथी को भेजें",
    enabledBadge: "सक्रिय ✓",
    hiddenBadge: "छिपा हुआ",
    savePhoneBtn: "नंबर सहेजें",
    phoneSaved: "सहेजा गया ✓",
    whatsAppNotice: "व्हाट्सएप बटन सभी कार्ड से हटा दिया गया है। केवल पसंदीदा ❤️ बटन दिखाई देगा!",
    
    // How To Cook Modal
    howToCookTitle: "पकाने की विधि",
    watchOnYouTube: "यूट्यूब पर वीडियो देखें 🎥",
    ingredientsTitle: "मुख्य सामग्री और राशन",
    stepsTitle: "बनाने का सरल तरीका",
    readyIn: "तैयार होने का समय",
    
    // Regions
    regions: {
      north: "उत्तर भारतीय",
      south: "दक्षिण भारतीय",
      west: "पश्चिम भारतीय",
      east: "पूर्व भारतीय",
      chinese: "देसी चाइनीज़",
      street_food: "स्ट्रीट फ़ूड",
    },
    chinese: "चाइनीज़",
    streetFood: "स्ट्रीट फ़ूड",
    
    // WhatsApp template
    whatsappShare: (mealName: string, slotTitle: string, needStr: string, booster: string, url: string) =>
      `नमस्ते! आज ${slotTitle} में *${mealName}* खाने का मन है 😋❤️${needStr}\n\nप्रोटीन बूस्ट: ${booster}\n\nGrub2Day पर देखें: ${url}`,
      
    // Toasts
    swappedToast: (dishName: string) => `✨ ${dishName} चुना गया! 6-दिन का चक्र अपडेट हो गया।`,
    cookedToast: "🍳 बहुत खूब! इस व्यंजन पर 6 दिन का कूलडाउन लागू हो गया है।",
    langSwitched: "🌐 भाषा: हिंदी चुनी गई",
    cravingAdded: "❤️ आज की आपकी पसंद के रूप में चुना गया!",
    cravingCleared: "पसंद हटाई गई",
    diningOutToast: "🍕 आज रात बाहर खाना! रसोई की छुट्टी।",
    fridgeSynced: "🧊 आपकी रसोई और फ्रिज के अनुसार मेनू अपडेट हो गया!",
    phoneSavedToast: "📱 मोबाइल नंबर सहेजा गया!",
    shuffledToast: "✨ मेनू नया हो गया! ताज़े और स्वादिष्ट व्यंजन तैयार हैं।",
  }
};
