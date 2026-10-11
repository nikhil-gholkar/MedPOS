import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type { DashboardStats, RecentStore } from "./dashboardTypes";

interface MedicalRecord {
  medicalName?: string;
  ownerName?: string;
  isActive?: boolean;
  createdAt?: string;
}

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const snapshot = await getDocs(collection(db, "medicals"));

  const medicals = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as MedicalRecord),
  }));

  const today = new Date().toDateString();

  // Registrations per month over the last six months
  const now = new Date();
  const monthlyGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthStart.toLocaleDateString("en-GB", { month: "short" });
    const count = medicals.filter((m) => {
      const created = parseDate(m.createdAt);
      return (
        created !== null &&
        created.getFullYear() === monthStart.getFullYear() &&
        created.getMonth() === monthStart.getMonth()
      );
    }).length;
    monthlyGrowth.push({ month: label, count });
  }

  // Most recent registrations
  const recentStores: RecentStore[] = medicals
    .filter((m) => parseDate(m.createdAt) !== null)
    .sort(
      (a, b) =>
        (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0)
    )
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      medicalName: m.medicalName ?? "Unnamed store",
      ownerName: m.ownerName ?? "—",
      createdAt: m.createdAt ?? "",
    }));

  return {
    totalMedicals: medicals.length,

    activeMedicals: medicals.filter((m) => m.isActive).length,

    inactiveMedicals: medicals.filter((m) => !m.isActive).length,

    todayAdded: medicals.filter((m) => {
      const created = parseDate(m.createdAt);
      return created !== null && created.toDateString() === today;
    }).length,

    monthlyGrowth,

    recentStores,
  };
};
