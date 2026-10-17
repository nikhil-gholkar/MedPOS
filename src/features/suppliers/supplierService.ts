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
  CreateSupplierPayload,
  Supplier,
  UpdateSupplierPayload,
} from "./supplierTypes";

export const getSuppliers = async (
  medicalId: string
): Promise<Supplier[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, "suppliers"),
      where("medicalId", "==", medicalId)
    )
  );

  return snapshot.docs.map(
    (docSnapshot) =>
      ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }) as Supplier
  );
};

export const createSupplier = async (
  medicalId: string,
  payload: CreateSupplierPayload
): Promise<void> => {
  const now = new Date().toISOString();

  await addDoc(collection(db, "suppliers"), {
    medicalId,
    supplierName: payload.supplierName,
    contactPerson: payload.contactPerson,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    notes: payload.notes,
    createdAt: now,
    updatedAt: now,
  });
};

export const updateSupplier = async (
  payload: UpdateSupplierPayload
): Promise<void> => {
  const { id, ...changes } = payload;

  await updateDoc(doc(db, "suppliers", id), {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteSupplier = async (
  supplierId: string
): Promise<void> => {
  await deleteDoc(
    doc(db, "suppliers", supplierId)
  );
};