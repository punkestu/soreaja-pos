import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';



const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

const TOKEN_KEY = 'google_access_token_cache';

const getStoredToken = (): string | null => {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    const { token, expiresAt } = JSON.parse(stored);
    if (Date.now() < expiresAt) {
      return token;
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  } catch (e) {
    return null;
  }
};

const storeToken = (token: string) => {
  const expiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
};

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

let isSigningIn = false;
let cachedAccessToken: string | null = getStoredToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedAccessToken = getStoredToken();
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      clearStoredToken();
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    storeToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  const token = getStoredToken();
  if (token) cachedAccessToken = token;
  return token;
};

export const logout = async () => {
  await auth.signOut();
  clearStoredToken();
  cachedAccessToken = null;
};
