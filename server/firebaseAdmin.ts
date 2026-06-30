import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

// Lazily initialised so the server can boot (and the Gemini routes keep
// working) even when no service-account credential is configured. Only the
// /api/extension/* routes actually need it, and they surface a clear error if
// credentials are missing.
let cachedDb: Firestore | null = null;

// Ensure the default admin app exists before anything (Firestore OR Auth) uses
// it. Calling getAuth()/getFirestore() before this throws "default app does not
// exist", so every accessor below routes through here first.
function ensureApp() {
  if (getApps().length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  // Firestore/Auth need to know which project to talk to. A service-account JSON
  // carries it; Application Default Credentials may not, so pass it explicitly.
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT;

  if (raw) {
    // Explicit service-account JSON in one env var (set this on Vercel).
    initializeApp({ credential: cert(JSON.parse(raw)), projectId });
  } else {
    // Application Default Credentials — covers `gcloud auth application-default
    // login` (keyless local dev), a GOOGLE_APPLICATION_CREDENTIALS key file,
    // and Cloud Run's metadata server. No downloadable key required, so it
    // works even when the org blocks service-account key creation.
    initializeApp({ credential: applicationDefault(), projectId });
  }
}

export function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb;
  ensureApp();
  // The project uses the (default) Firestore database. If that ever changes,
  // set FIREBASE_FIRESTORE_DATABASE_ID to the named database id.
  const dbId = process.env.FIREBASE_FIRESTORE_DATABASE_ID;
  cachedDb = dbId && dbId !== "(default)" ? getFirestore(dbId) : getFirestore();
  return cachedDb;
}

export function getAdminAuth(): Auth {
  ensureApp();
  return getAuth();
}
