#!/usr/bin/env node
/**
 * One-time migration: legacy users docs (username + plaintext password) to
 * Firebase Auth + uid-keyed role documents.
 *
 * What it does:
 *   1. Bootstraps the Superadmin Firebase Auth account — nothing in the
 *      client can do this, because firestore.rules only let an existing
 *      superadmin write users/, and no uid-keyed superadmin exists yet.
 *   2. Creates Auth accounts for every legacy medical user, reusing the
 *      legacy password so store owners keep their current login.
 *   3. Re-keys each profile to users/{uid} (document ID == Auth UID, as
 *      firestore.rules require), drops the `password` field, and deletes
 *      the legacy auto-id document.
 *
 * The Admin SDK bypasses security rules, which is exactly why this must run
 * offline and never ship to the client.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   npm run migrate:auth -- --superadmin-email owner@clinic.com            # dry run
 *   npm run migrate:auth -- --superadmin-email owner@clinic.com --apply   # writes
 *
 * Options:
 *   --apply                    perform mutations (default is a dry run)
 *   --project <id>             Firebase project id (default: GCLOUD_PROJECT
 *                              or VITE_projectId from .env / .env.local)
 *   --superadmin-email <email> login email for the superadmin account;
 *                              required if their legacy doc has no email
 *   --new-password <pwd>       fallback when a legacy password is too short
 *                              for Firebase Auth (min 6 chars) or missing
 */
import { readdirSync, readFileSync } from "node:fs";

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const APPLY = hasFlag("--apply");
const SUPERADMIN_EMAIL = opt("--superadmin-email");
const NEW_PASSWORD = opt("--new-password");

function projectIdFromEnvFile() {
  // Any .env* file in the project root (.env, .env.local, .env.development, ...)
  let candidates = [];
  try {
    candidates = readdirSync(".").filter((f) => f.startsWith(".env"));
  } catch {
    // unreadable directory — fall through to .firebaserc
  }
  // Prefer the files Vite reads first
  candidates.sort((a, b) => {
    const rank = (n) => (n === ".env" ? 0 : n === ".env.local" ? 1 : 2);
    return rank(a) - rank(b);
  });

  for (const file of candidates) {
    try {
      const text = readFileSync(file, "utf8").replace(/^\uFEFF/, ""); // strip BOM
      const match = text.match(/^\s*VITE_projectId\s*=\s*(.+?)\s*$/m);
      if (match) {
        // strip surrounding quotes
        return match[1].replace(/^["']|["']$/g, "");
      }
    } catch {
      // try the next env file
    }
  }

  // Firebase CLI fallback
  try {
    const rc = JSON.parse(readFileSync(".firebaserc", "utf8"));
    const id = rc?.projects?.default;
    if (typeof id === "string" && id.length > 0) return id;
  } catch {
    // no .firebaserc — nothing more to try
  }

  return null;
}

function resolveProjectId() {
  const explicit = opt("--project") ?? process.env.GCLOUD_PROJECT;
  if (explicit) return explicit;

  if (process.env.FIREBASE_CONFIG) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
      if (parsed?.projectId) return parsed.projectId;
    } catch {
      // malformed FIREBASE_CONFIG — fall through to the env files
    }
  }

  return projectIdFromEnvFile();
}

const PROJECT = resolveProjectId();

if (!PROJECT) {
  console.error(
    "No project id found. Easiest: pass --project <firebase-project-id>\n" +
      "(the id is in the console URL: firebase.google.com/console/<id>),\n" +
      "or define VITE_projectId in one of the .env* files in the project root."
  );
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "GOOGLE_APPLICATION_CREDENTIALS is not set.\n" +
      "Firebase console → Project settings → Service accounts → " +
      "Generate new private key, then export that path."
  );
  process.exit(1);
}

initializeApp({
  projectId: PROJECT,
  credential: applicationDefault(),
});

const auth = getAuth();
const db = getFirestore();

const mode = APPLY ? "APPLY" : "DRY RUN";
const plan = []; // one entry per legacy doc: {ok, line}
const failures = [];

const note = (line, ok = true) => {
  plan.push({ line, ok });
  if (!ok) failures.push(line);
};

async function ensureAuthUser(email, preferredPassword, apply) {
  try {
    const existing = await auth.getUserByEmail(email);
    return { uid: existing.uid, created: false };
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      return { error: `lookup failed: ${error.message}` };
    }
  }

  if (!apply) return { uid: "(would be created)", created: true };

  try {
    const created = await auth.createUser({ email, password: preferredPassword });
    return { uid: created.uid, created: true };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log(`[${mode}] Migrating users → Firebase Auth (project: ${PROJECT})\n`);

  const snapshot = await db.collection("users").get();
  const allUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const legacy = allUsers.filter((u) => typeof u.password === "string");

  console.log(
    `Found ${allUsers.length} users doc(s): ${legacy.length} legacy (plaintext), ` +
      `${allUsers.length - legacy.length} already migrated.\n`
  );

  if (legacy.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  // Superadmin first: if anything later fails, the platform admin exists.
  legacy.sort((a, b) =>
    a.role === "superadmin" ? -1 : b.role === "superadmin" ? 1 : 0
  );

  const seenEmails = new Set();

  for (const doc of legacy) {
    const label = `role=${doc.role} users/${doc.id}`;

    // --- resolve login email -------------------------------------------------
    let email = doc.email ?? null;
    if (doc.role === "superadmin") email = email ?? SUPERADMIN_EMAIL;

    if (doc.role === "medical") {
      if (!doc.medicalId) {
        note(`${label}: no medicalId on the doc — cannot bind to a store`, false);
        continue;
      }
      const medical = await db.collection("medicals").doc(doc.medicalId).get();
      const storeEmail = medical.exists ? medical.data().email : null;
      email = email ?? storeEmail ?? null;
      if (!storeEmail) {
        note(
          `${label}: store medicals/${doc.medicalId} has no email — ` +
            `add one, then re-run`,
          false
        );
        continue;
      }
    }

    if (!email) {
      note(
        `${label}: no email known — re-run with --superadmin-email you@domain`,
        false
      );
      continue;
    }

    if (seenEmails.has(email)) {
      note(`${label}: duplicate login email ${email} — resolve manually`, false);
      continue;
    }
    seenEmails.add(email);

    // --- resolve password ----------------------------------------------------
    const legacyPassword =
      typeof doc.password === "string" && doc.password.length >= 6
        ? doc.password
        : null;
    const password = legacyPassword ?? NEW_PASSWORD;

    if (!password) {
      note(
        `${label} (${email}): legacy password missing/too short (<6 chars) — ` +
          `re-run with --new-password <pwd>`,
        false
      );
      continue;
    }

    // --- create / reuse the Auth account -------------------------------------
    const result = await ensureAuthUser(email, password, APPLY);
    if (result.error) {
      note(`${label} (${email}): ${result.error}`, false);
      continue;
    }

    // --- canonical uid-keyed profile (no credentials) ------------------------
    const body = {
      email,
      role: doc.role,
      isActive: doc.isActive === true,
      createdAt: doc.createdAt ?? new Date().toISOString(),
    };
    if (doc.medicalId) body.medicalId = doc.medicalId;
    if (doc.username) body.username = doc.username;

    if (APPLY) {
      await db.collection("users").doc(result.uid).set(body, { merge: false });
      if (doc.id !== result.uid) {
        await db.collection("users").doc(doc.id).delete();
      }
    }

    const action = result.created ? "created auth account" : "matched existing auth user";
    const rekeyed = doc.id !== result.uid ? `, re-keyed from ${doc.id}` : "";
    note(
      `${label} → ${email}: ${action} (uid=${result.uid}${rekeyed})` +
        `${APPLY ? "" : " [dry run — nothing written]"}`
    );
  }

  console.log("");
  for (const { line, ok } of plan) {
    console.log(`${ok ? "  OK  " : " FAIL "} ${line}`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} account(s) could not be migrated.`);
    process.exit(1);
  }

  if (!APPLY) {
    console.log(
      "\nDry run only. Re-run with --apply to write. " +
        "After that: enable Email/Password in Firebase Auth → Sign-in method."
    );
  } else {
    console.log(
      `\nMigration applied. ${legacy.length} legacy doc(s) converted; ` +
        "passwords live only in Firebase Auth now."
    );
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});