import type { Request, Response, NextFunction } from "express";
import { getAdminDb } from "./firebaseAdmin.js";

// Resolved identity behind an extension API key. The key maps to a single
// Firebase user + project, so today it's just you; adding more reps later is
// one extra `extension_keys` doc each, with no schema change.
export interface ExtensionIdentity {
  key: string;
  uid: string;
  projectId: string;
  senderName: string;
  companyName: string;
  companyWebsite: string;
}

export async function resolveExtensionAuth(
  req: Request
): Promise<ExtensionIdentity | null> {
  const key = req.header("x-extension-key");
  if (!key) return null;

  const db = await getAdminDb();
  const snap = await db.collection("extension_keys").doc(key).get();
  if (!snap.exists) return null;

  const data = snap.data() ?? {};
  if (!data.uid || !data.projectId) return null;

  return {
    key,
    uid: data.uid,
    projectId: data.projectId,
    senderName: data.senderName ?? "",
    companyName: data.companyName ?? "",
    companyWebsite: data.companyWebsite ?? "",
  };
}

// The extension is a cross-origin caller, so every /api/extension/* response
// needs permissive CORS, and OPTIONS preflights must short-circuit.
export function extensionCors(req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-extension-key");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}
