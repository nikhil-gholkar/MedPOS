import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type {
  AuthUser,
  UserDocument,
} from "../../types/auth.types";

export const loginUser = async (
  username: string,
  password: string
): Promise<AuthUser> => {
  const q = query(
    collection(db, "users"),
    where("username", "==", username),
    where("password", "==", password),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid Credentials");
  }

  const userDoc =
    snapshot.docs[0].data() as UserDocument;

  const user: AuthUser = {
    id: userDoc.id,
    username: userDoc.username,
    role: userDoc.role,
    medicalId: userDoc.medicalId,
  };

  return user;
};