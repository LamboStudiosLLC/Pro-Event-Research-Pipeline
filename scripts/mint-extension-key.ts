/**
 * Mint (or inspect) an extension API key.
 *
 * Requires a service-account credential, same as the server:
 *   FIREBASE_SERVICE_ACCOUNT='{...json...}'  (or GOOGLE_APPLICATION_CREDENTIALS=path)
 *
 * Discover your uid + projectId:
 *   npx tsx scripts/mint-extension-key.ts
 *
 * Mint a key for a user + project (USER_UID, not UID — UID is readonly in zsh):
 *   USER_UID=... PROJECT_ID=... SENDER_NAME="Ben Merlotti" \
 *   COMPANY_NAME="Druid Productions" COMPANY_WEBSITE="https://druid.example" \
 *   npx tsx scripts/mint-extension-key.ts
 */
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { getAdminDb } from "../server/firebaseAdmin";

dotenv.config();

async function listUsers() {
  const db = await getAdminDb();
  const users = await db.collection("users").get();
  if (users.empty) {
    console.log("No users found in the `users` collection.");
    return;
  }
  console.log("Pass UID and PROJECT_ID from the list below, then re-run:\n");
  for (const user of users.docs) {
    const u = user.data();
    console.log(`UID=${user.id}  (${u.email ?? u.displayName ?? "unknown"})`);
    const projects = await user.ref.collection("projects").get();
    if (projects.empty) {
      console.log("    (no projects)");
    }
    for (const project of projects.docs) {
      console.log(`    PROJECT_ID=${project.id}  "${project.data().name ?? ""}"`);
    }
    console.log("");
  }
}

async function mintKey(uid: string, projectId: string) {
  const db = await getAdminDb();
  const key = `ext_${randomBytes(24).toString("hex")}`;
  await db.collection("extension_keys").doc(key).set({
    uid,
    projectId,
    senderName: process.env.SENDER_NAME ?? "",
    companyName: process.env.COMPANY_NAME ?? "",
    companyWebsite: process.env.COMPANY_WEBSITE ?? "",
    createdAt: new Date().toISOString(),
  });
  console.log("Extension key created. Paste this into the extension settings:\n");
  console.log(`  ${key}\n`);
  console.log(`  -> uid=${uid} projectId=${projectId}`);
}

async function main() {
  const uid = process.env.USER_UID;
  const projectId = process.env.PROJECT_ID;
  if (uid && projectId) {
    await mintKey(uid, projectId);
  } else {
    await listUsers();
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
