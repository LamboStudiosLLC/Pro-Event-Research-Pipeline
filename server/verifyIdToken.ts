// Verify a Firebase ID token WITHOUT firebase-admin's verifyIdToken. That path
// pulls in jwks-rsa, which CJS-`require()`s the ESM-only `jose` package and
// throws "require() of ES Module ... not supported" when bundled on Vercel.
// A dynamic import() of jose works from CJS on every Node version, so we verify
// the token ourselves against Google's public signing certificates.

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; name?: string }> {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not set");

  const jose = await import("jose");

  const { kid } = jose.decodeProtectedHeader(idToken);
  if (!kid) throw new Error("ID token has no 'kid' header");

  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`failed to fetch signing certs (${res.status})`);
  const certs = (await res.json()) as Record<string, string>;
  const pem = certs[kid];
  if (!pem) throw new Error("no matching signing key for token 'kid'");

  const key = await jose.importX509(pem, "RS256");
  const { payload } = await jose.jwtVerify(idToken, key, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  if (!payload.sub) throw new Error("ID token has no 'sub'");
  return { uid: payload.sub, name: payload.name as string | undefined };
}
