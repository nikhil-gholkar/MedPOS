import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase/firebaseConfig";

import type {
  AuthUser,
  UserDocument,
} from "../../types/auth.types";

/**
 * Profile lives at users/{uid} — the document ID IS the Firebase Auth UID.
 * firestore.rules read the same document to resolve role and medicalId, so
 * the client and the rules can never disagree about who you are.
 */
export const fetchProfile = async (
  uid: string
): Promise<UserDocument | null> => {
  const snapshot = await getDoc(
    doc(db, "users", uid)
  );

  return snapshot.exists()
    ? (snapshot.data() as UserDocument)
    : null;
};

export const buildAuthUser = (
  uid: string,
  email: string,
  profile: UserDocument
): AuthUser => ({
  id: uid,
  username:
    profile.username ??
    email.split("@")[0] ??
    email,
  email,
  role: profile.role,
  medicalId: profile.medicalId,
});

/**
 * Sign in with Firebase Auth (email + password), then load the platform
 * profile. Credentials are verified by Firebase Auth — never by Firestore.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  let uid: string;
  let resolvedEmail: string;

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    uid = credential.user.uid;
    resolvedEmail = credential.user.email ?? email;
  } catch (error) {
    const code =
      (error as { code?: string }).code ?? "";

    if (code === "auth/user-disabled") {
      throw new Error("This account is deactivated.", {
        cause: error,
      });
    }

    if (code.startsWith("auth/")) {
      // invalid-credential / invalid-email / too-many-requests —
      // never reveal which part was wrong.
      throw new Error("Invalid email or password.", {
        cause: error,
      });
    }

    // Non-auth failure (e.g. network) — surface it as-is.
    throw error;
  }

  const profile = await fetchProfile(uid);

  if (!profile) {
    // Signed into Firebase Auth but no users/{uid} role document exists:
    // the account has no platform access yet.
    await signOut(auth);
    throw new Error("This account is not provisioned.");
  }

  if (profile.isActive !== true) {
    await signOut(auth);
    throw new Error("This account is deactivated.");
  }

  return buildAuthUser(uid, resolvedEmail, profile);
};

export const signOutSession = async (): Promise<void> => {
  await signOut(auth);
};