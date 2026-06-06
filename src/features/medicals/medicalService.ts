

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
  };

export const createMedical =
  async (
    payload: CreateMedicalPayload
  ) => {
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


      

    await addDoc(
      collection(db, "users"),
      {
        username: payload.username,
        password: payload.password,
        role: "medical",
        medicalId: medicalRef.id,
        isActive: true,
        createdAt:
          new Date().toISOString(),
      }
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