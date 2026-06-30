import { writeFileSync } from "node:fs";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

// Lazily initialised so the server can boot (and the Gemini routes keep
// working) even when no credential is configured. Only the /api/extension/*
// routes need it, and they surface a clear error if credentials are missing.
let cachedDb: Firestore | null = null;
let wifTokenPath: string | null = null;

// Vercel injects a short-lived OIDC token (VERCEL_OIDC_TOKEN) per invocation.
// google-auth reads it from a file on each refresh, so we keep that file current
// on every call rather than only at init (warm functions outlive one token).
function syncVercelOidcToken() {
  if (wifTokenPath && process.env.VERCEL_OIDC_TOKEN) {
    try {
      writeFileSync(wifTokenPath, process.env.VERCEL_OIDC_TOKEN, "utf8");
    } catch (e) {
      console.error("[firebaseAdmin] failed to write OIDC token file:", e);
    }
  }
}

// Ensure the default admin app exists before anything (Firestore OR Auth) uses
// it; also refresh the Vercel OIDC token on every call.
function ensureApp() {
  if (getApps().length) {
    syncVercelOidcToken();
    return;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    // Explicit service-account JSON in one env var.
    initializeApp({ credential: cert(JSON.parse(raw)), projectId });
    return;
  }

  // Keyless Workload Identity Federation on Vercel: GOOGLE_WIF_CONFIG is the
  // (non-secret) external-account config; the OIDC token comes from Vercel. We
  // materialise both to /tmp and let Application Default Credentials use them.
  const wifConfig = process.env.GOOGLE_WIF_CONFIG;
  if (wifConfig && process.env.VERCEL_OIDC_TOKEN) {
    const parsed = JSON.parse(wifConfig);
    wifTokenPath = parsed?.credential_source?.file ?? "/tmp/vercel_oidc_token";
    writeFileSync(wifTokenPath, process.env.VERCEL_OIDC_TOKEN, "utf8");
    const configPath = "/tmp/gcp-wif-config.json";
    writeFileSync(configPath, wifConfig, "utf8");
    process.env.GOOGLE_APPLICATION_CREDENTIALS = configPath;
  }

  // Application Default Credentials — covers Vercel WIF (above), `gcloud auth
  // application-default login` (keyless local dev), a GOOGLE_APPLICATION_CREDENTIALS
  // key file, and Cloud Run's metadata server. No downloadable key required.
  initializeApp({ credential: applicationDefault(), projectId });
}

export function getAdminDb(): Firestore {
  ensureApp();
  if (cachedDb) return cachedDb;
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
