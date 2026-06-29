import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const env = (import.meta as any).env || {};

// Optional local fallback config. This file is gitignored and absent in
// production builds (e.g. Vercel), so it is loaded via import.meta.glob —
// which resolves to an empty object when the file is missing instead of
// failing the build. Production relies entirely on the VITE_FIREBASE_* env
// vars below; the file only serves local development.
const appletModules = import.meta.glob('../../firebase-applet-config.json', { eager: true }) as Record<string, { default: Record<string, string> }>;
const appletConfig: Record<string, string> = Object.values(appletModules)[0]?.default ?? {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore without passing "(default)" as a custom named database
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Validate Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firebase Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
void testConnection();
