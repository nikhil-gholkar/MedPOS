import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type {
  CreateMedicinePayload,
  Medicine,
} from "./inventoryTypes";

export const createMedicine = async (
  medicalId: string,
  payload: CreateMedicinePayload
) => {
  await addDoc(
    collection(db, "inventory"),
    {
      medicalId,

      ...payload,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    }
  );
};

export const getMedicines = async (
  medicalId: string
): Promise<Medicine[]> => {
  const q = query(
    collection(db, "inventory"),
    where(
      "medicalId",
      "==",
      medicalId
    )
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map(
    (docSnapshot) =>
      ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }) as Medicine
  );
};

export const updateMedicine =
  async (
    medicineId: string,
    payload: Partial<CreateMedicinePayload>
  ) => {
    const medicineRef = doc(
      db,
      "inventory",
      medicineId
    );

    await updateDoc(
      medicineRef,
      {
        ...payload,

        updatedAt:
          new Date().toISOString(),
      }
    );
  };

export const deleteMedicine =
  async (
    medicineId: string
  ) => {
    await deleteDoc(
      doc(
        db,
        "inventory",
        medicineId
      )
    );
  };