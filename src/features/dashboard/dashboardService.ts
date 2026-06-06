import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type { DashboardStats } from "./dashboardTypes";

export const getDashboardStats =
  async (): Promise<DashboardStats> => {
    const snapshot = await getDocs(
      collection(db, "medicals")
    );

    const medicals =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    const today =
      new Date().toDateString();

    return {
      totalMedicals:
        medicals.length,

      activeMedicals:
        medicals.filter(
          (m: any) => m.isActive
        ).length,

      inactiveMedicals:
        medicals.filter(
          (m: any) => !m.isActive
        ).length,

      todayAdded:
        medicals.filter(
          (m: any) =>
            new Date(
              m.createdAt
            ).toDateString() ===
            today
        ).length,
    };
  };