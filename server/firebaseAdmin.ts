import { writeFileSync } from "node:fs";
import { getVercelOidcTokenSync } from "@vercel/functions/oidc";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

// firebase-admin is imported DYNAMICALLY (not statically) so it never enters the
// load-time module graph. These accessors are therefore async.
let cachedDb: Firestore | null = null;
let wifTokenPath: string | null = null;

// Vercel exposes the OIDC token through its helper (request-scoped), NOT reliably
// as process.env.VERCEL_OIDC_TOKEN — so read it via the helper, falling back to
// the env var for other runtimes. Returns undefined locally (where ADC is used).
function getOidcToken(): string | undefined {
  try {
    const t = getVercelOidcTokenSync();
    if (t) return t;
  } catch {
    // Not in a Vercel OIDC request context.
  }
  return process.env.VERCEL_OIDC_TOKEN;
}

// google-auth reads the OIDC token from a file on each credential refresh, so we
// keep that file current on every call (warm functions outlive one token).
function syncVercelOidcToken() {
  if (!wifTokenPath) return;
  const token = getOidcToken();
  if (token) {
    try {
      writeFileSync(wifTokenPath, token, "utf8");
    } catch (e) {
      console.error("[firebaseAdmin] failed to write OIDC token file:", e);
    }
  }
}

async function ensureApp() {
  const { getApps, initializeApp, cert, applicationDefault } = await import("firebase-admin/app");
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
    initializeApp({ credential: cert(JSON.parse(raw)), projectId });
    return;
  }

  // Keyless Workload Identity Federation on Vercel: GOOGLE_WIF_CONFIG is the
  // (non-secret) external-account config; the OIDC token comes from Vercel. We
  // materialise both to /tmp and let Application Default Credentials use them.
  const wifConfig = process.env.GOOGLE_WIF_CONFIG;
  const oidcToken = getOidcToken();
  if (wifConfig && oidcToken) {
    const parsed = JSON.parse(wifConfig);
    wifTokenPath = parsed?.credential_source?.file ?? "/tmp/vercel_oidc_token";
    writeFileSync(wifTokenPath, oidcToken, "utf8");
    const configPath = "/tmp/gcp-wif-config.json";
    writeFileSync(configPath, wifConfig, "utf8");
    process.env.GOOGLE_APPLICATION_CREDENTIALS = configPath;
  }

  // Clear diagnostic when running on Vercel without a usable credential source.
  if (process.env.VERCEL && !raw && !(wifConfig && oidcToken)) {
    throw new Error(
      "Firebase Admin credentials missing on Vercel — " +
        `GOOGLE_WIF_CONFIG: ${wifConfig ? "set" : "MISSING"}, ` +
        `VERCEL_OIDC_TOKEN: ${oidcToken ? "present" : "MISSING"}, ` +
        `FIREBASE_PROJECT_ID: ${projectId ? "set" : "MISSING"}.`
    );
  }

  // Application Default Credentials — covers Vercel WIF (above), `gcloud auth
  // application-default login` (keyless local dev), a key file, and Cloud Run.
  initializeApp({ credential: applicationDefault(), projectId });
}

export async function getAdminDb(): Promise<Firestore> {
  await ensureApp();
  if (cachedDb) return cachedDb;
  const { getFirestore } = await import("firebase-admin/firestore");
  const dbId = process.env.FIREBASE_FIRESTORE_DATABASE_ID;
  cachedDb = dbId && dbId !== "(default)" ? getFirestore(dbId) : getFirestore();
  return cachedDb;
}

export async function getAdminAuth(): Promise<Auth> {
  await ensureApp();
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth();
}
