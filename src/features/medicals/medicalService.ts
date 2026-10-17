

import { db } from "../../firebase/firebaseConfig";

import type {
  Medical,
  CreateMedicalPayload,
  UpdateMedicalPayload,
} from "./medicalTypes";
import {
  addDoc,
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

export const getAllMedicals =
  async (): Promise<Medical[]> => {
    const snapshot = await getDocs(
      collection(db, "medicals")
    );

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Medical
    );
  };/**
 * Create a Firebase Auth account for the store's login.
 *
 * Deliberately uses the REST accounts:signUp endpoint instead of
 * createUserWithEmailAndPassword: the SDK call would sign the NEW user into
 * this browser session and log the superadmin out mid-flow. A plain HTTP
 * call creates the account server-side and leaves the current session alone.
 *
 * Runs before any Firestore write so an invalid email / weak password fails
 * fast, leaving no half-created medical store behind.
 */
const provisionAuthAccount = async (
  email: string,
  password: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_apiKey;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = (await response.json()) as {
    localId?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.localId) {
    const message = data.error?.message ?? "";

    if (message === "EMAIL_EXISTS") {
      throw new Error(
        "An account with this email already exists."
      );
    }

    throw new Error(
      message === "INVALID_EMAIL"
        ? "The login email is not valid."
        : message === "WEAK_PASSWORD"
          ? "The password must be at least 6 characters."
          : "Could not create the login account."
    );
  }

  // Tokens are intentionally discarded — the superadmin session stays active.
  return data.localId;
};

export const createMedical =
  async (
    payload: CreateMedicalPayload
  ) => {
    // 1. Firebase Auth account (email + password live only here).
    const uid = await provisionAuthAccount(
      payload.email,
      payload.password
    );

    // 2. Tenant record. No credentials, ever.
    const medicalRef =
      await addDoc(
        collection(db, "medicals"),
        {
          medicalName:
            payload.medicalName,
          ownerName:
            payload.ownerName,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          isActive: true,
          createdAt:
            new Date().toISOString(),
        }
      );

    // 3. Role document — document ID MUST equal the Auth UID, which is what
    //    firestore.rules read to resolve role and medicalId.
    //    (If this write fails, the orphan Auth account has no role document
    //    and is denied all data access — safe, just re-run/repair.)
    await setDoc(
      doc(db, "users", uid),
      {
        email: payload.email,
        role: "medical",
        medicalId: medicalRef.id,
        isActive: true,
        createdAt:
          new Date().toISOString(),
      }
    );
  };

/**
 * Full tenant wipe: login first, then stock and sales, and the store record
 * last. Ordering guarantees we end up with a loginless store (safe, visible,
 * retryable) rather than an active login whose store no longer exists.
 *
 * Requires the superadmin delete grants in firestore.rules — deploy them
 * together with this change or the inventory/sales deletes will be denied.
 */
export const deleteMedical = async (
  medicalId: string
) => {
  // 1. Login — without it the tenant has no access left.
  const userDocs = await getDocs(
    query(
      collection(db, "users"),
      where("medicalId", "==", medicalId)
    )
  );
  for (const snapshot of userDocs.docs) {
    await deleteDoc(
      doc(db, "users", snapshot.id)
    );
  }

  // 2. Stock
  const inventoryDocs = await getDocs(
    query(
      collection(db, "inventory"),
      where("medicalId", "==", medicalId)
    )
  );
  for (const snapshot of inventoryDocs.docs) {
    await deleteDoc(
      doc(db, "inventory", snapshot.id)
    );
  }

  // 3. Sales history
  const salesDocs = await getDocs(
    query(
      collection(db, "sales"),
      where("medicalId", "==", medicalId)
    )
  );
  for (const snapshot of salesDocs.docs) {
    await deleteDoc(
      doc(db, "sales", snapshot.id)
    );
  }

  // 4. Tenant root last
  await deleteDoc(
    doc(db, "medicals", medicalId)
  );
};

  export const updateMedical =
  async (payload: UpdateMedicalPayload) => {
    await updateDoc(
      doc(db, "medicals", payload.id),
      {
        medicalName:
          payload.medicalName,
        ownerName:
          payload.ownerName,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
      }
    );
  };

export const toggleMedicalStatus =
  async (
    medicalId: string,
    currentStatus: boolean
  ) => {
    await updateDoc(
      doc(db, "medicals", medicalId),
      {
        isActive: !currentStatus,
      }
    );

    const usersSnapshot =
      await getDocs(
        query(
          collection(db, "users"),
          where(
            "medicalId",
            "==",
            medicalId
          )
        )
      );

    if (!usersSnapshot.empty) {
      const userDoc =
        usersSnapshot.docs[0];

      await updateDoc(
        doc(
          db,
          "users",
          userDoc.id
        ),
        {
          isActive:
            !currentStatus,
        }
      );
    }
  };