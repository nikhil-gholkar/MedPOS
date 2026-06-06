import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type {
  CreateSalePayload,
  SaleTransaction,
} from "./posTypes";
import type { SaleItem } from "./posTypes";

export const createSale = async (
  payload: CreateSalePayload
) => {
  await addDoc(
    collection(db, "sales"),
    {
      ...payload,
      createdAt: new Date().toISOString(),
    }
  );
};

/**
 * Deduct stock quantities atomically using a Firestore transaction.
 * All reads happen first, then all writes — required by Firestore.
 * Throws if any item has insufficient stock.
 */
export const deductStock = async (
  items: SaleItem[]
) => {
  await runTransaction(db, async (transaction) => {
    // Step 1: Read all inventory docs, validate stock, compute new quantities
    const updates = await Promise.all(
      items.map(async (item) => {
        const ref = doc(db, "inventory", item.medicineId);
        const snapshot = await transaction.get(ref);

        if (!snapshot.exists()) {
          throw new Error(`Medicine ${item.medicineName} not found in inventory`);
        }

        const currentQty = snapshot.data()!.quantity ?? 0;
        if (currentQty < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.medicineName}: ${currentQty} available, ${item.quantity} requested`
          );
        }

        return { ref, newQty: currentQty - item.quantity };
      })
    );

    // Step 2: All writes after all reads
    for (const { ref, newQty } of updates) {
      transaction.update(ref, {
        quantity: newQty,
        updatedAt: new Date().toISOString(),
      });
    }
  });
};

export const getTodaySales = async (
  medicalId: string
): Promise<SaleTransaction[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Simple equality query — no orderBy to avoid composite index requirement
  const q = query(
    collection(db, "sales"),
    where("medicalId", "==", medicalId)
  );

  const snapshot = await getDocs(q);
  const allSales = snapshot.docs.map(
    (docSnapshot) =>
      ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }) as SaleTransaction
  );

  // Filter today's sales in JavaScript
  return allSales.filter((sale) => {
    const createdAt = new Date(sale.createdAt);
    return createdAt >= today;
  });
};


