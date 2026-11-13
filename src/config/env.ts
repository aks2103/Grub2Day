// ==============================================================================
// Grub2Day — Environment Configuration Wrapper
// ==============================================================================

export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || "Grub2Day",
  tagline: import.meta.env.VITE_APP_TAGLINE || "Ghar Ka Khana, Zero Bahana! 🍲",
  
  // Database type: 'local' (IndexedDB/LocalStorage NoSQL) or 'firestore'
  dbType: (import.meta.env.VITE_DB_TYPE as 'local' | 'firestore') || 'local',
  
  // Profile targets for 36M, 78kg, 180cm (Recomposition)
  husbandName: import.meta.env.VITE_HUSBAND_NAME || "Alok",
  proteinTargetGrams: Number(import.meta.env.VITE_HUSBAND_PROTEIN_TARGET) || 120,
  calorieTarget: Number(import.meta.env.VITE_HUSBAND_CALORIE_TARGET) || 1800,
  cooldownDays: Number(import.meta.env.VITE_COOLDOWN_DAYS) || 6,

  // Firebase configurations for future integration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  }
};
