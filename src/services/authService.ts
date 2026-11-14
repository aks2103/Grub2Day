// ==============================================================================
// Grub2Day — Google Authentication & User Profile Service
// Allows multiple users/family members to log in and maintain individual food preferences
// ==============================================================================

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
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

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured with valid credentials.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  return result.user;
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
