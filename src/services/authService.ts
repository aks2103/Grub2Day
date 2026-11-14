// ==============================================================================
// Grub2Day — Google Authentication & User Profile Service
// Allows multiple users/family members to log in and maintain individual food preferences
// ==============================================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  User,
  Auth
} from 'firebase/auth';
import { APP_CONFIG } from '../config/env';

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;

  const { apiKey, projectId } = APP_CONFIG.firebase;
  if (!apiKey || !projectId || apiKey.includes('your-api-key') || projectId.includes('your-project-id')) {
    return null;
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(APP_CONFIG.firebase);
    } else {
      appInstance = getApps()[0];
    }
    authInstance = getAuth(appInstance);
    return authInstance;
  } catch (err) {
    console.warn('Firebase Auth initialization skipped:', err);
    return null;
  }
}

export interface AuthErrorInfo {
  code: string;
  title: string;
  message: string;
  actionUrl?: string;
}

export function formatAuthError(err: any): AuthErrorInfo {
  const code = err?.code || '';
  const rawMsg = err?.message || '';

  if (code === 'auth/configuration-not-found' || rawMsg.includes('CONFIGURATION_NOT_FOUND')) {
    return {
      code: 'auth/configuration-not-found',
      title: 'Firebase Auth Not Activated in Console',
      message: 'Firebase Authentication has not been activated yet for your Firebase project (ytmusicsync-alok).\n\nTo activate it:\n1. Click the button below to open Firebase Console.\n2. Click "Get started".\n3. Under Sign-in method, select "Google" and toggle "Enable".\n4. Save.',
      actionUrl: `https://console.firebase.google.com/project/${APP_CONFIG.firebase.projectId || 'ytmusicsync-alok'}/authentication`,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code: 'auth/operation-not-allowed',
      title: 'Google Provider Not Enabled',
      message: 'Google Sign-in is not enabled in Firebase Authentication.\n\nGo to Firebase Console > Authentication > Sign-in method and enable Google.',
      actionUrl: `https://console.firebase.google.com/project/${APP_CONFIG.firebase.projectId || 'ytmusicsync-alok'}/authentication/providers`,
    };
  }

  if (code === 'auth/unauthorized-domain') {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return {
      code: 'auth/unauthorized-domain',
      title: 'Domain Not Authorized',
      message: `Your current domain/IP (${currentHost}) is not in Firebase Authorized Domains.\n\nAdd "${currentHost}" under Firebase Console > Authentication > Settings > Authorized domains.`,
      actionUrl: `https://console.firebase.google.com/project/${APP_CONFIG.firebase.projectId || 'ytmusicsync-alok'}/authentication/settings`,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      code: 'auth/popup-blocked',
      title: 'Pop-up Blocked by Browser',
      message: 'Your browser or mobile device blocked the Google login popup. Please allow popups for this site or try again.',
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code: 'auth/popup-closed-by-user',
      title: 'Sign-in Cancelled',
      message: 'The Google sign-in popup was closed before completing.',
    };
  }

  return {
    code: code || 'unknown',
    title: 'Google Sign-in Failed',
    message: rawMsg || 'An unexpected error occurred during Google sign in.',
  };
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured with valid credentials.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    if (err?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr) {
        throw redirectErr;
      }
    }
    throw err;
  }
}

export async function checkRedirectAuth(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.warn("getRedirectResult error:", err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// ==============================================================================
// Multi-Profile Household Switcher
// Allows seamless 1-tap switching between household members (Alok, Partner, etc.)
// with completely isolated food preferences, pantry items, and meal cycles!
// ==============================================================================

export interface HouseholdProfile {
  id: string;
  name: string;
  role: string;
  avatarIcon: string;
}

const DEFAULT_PROFILES: HouseholdProfile[] = [
  { id: 'alok', name: 'Alok', role: 'Husband', avatarIcon: '👨‍💼' },
  { id: 'partner', name: 'Partner', role: 'Partner / Wife', avatarIcon: '👩‍🍳' },
];

export function getHouseholdProfiles(): HouseholdProfile[] {
  try {
    const raw = localStorage.getItem('grub2day_household_profiles');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DEFAULT_PROFILES;
}

export function saveHouseholdProfiles(profiles: HouseholdProfile[]): void {
  localStorage.setItem('grub2day_household_profiles', JSON.stringify(profiles));
}

export function getActiveProfileId(): string {
  return localStorage.getItem('grub2day_active_profile_id') || 'alok';
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem('grub2day_active_profile_id', id);
}
