import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type {
  MedicalDashboardStats,
} from "./medicalDashboardTypes";

export interface WeeklyRevenuePoint {
  day: string;
  revenue: number;
}

export const getMedicalDashboardStats = async (
  medicalId: string
): Promise<MedicalDashboardStats> => {
  // Inventory: simple equality query (uses default single-field index)
  const inventoryQuery = query(
    collection(db, "inventory"),
    where("medicalId", "==", medicalId)
  );
  const inventorySnapshot = await getDocs(inventoryQuery);
  const inventory = inventorySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const lowStockItems = inventory.filter(
    (item: any) => item.quantity <= 10
  ).length;

  const nearExpiryItems = inventory.filter(
    (item: any) => {
      const expiry = new Date(item.expiryDate);
      const diffDays = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }
  ).length;

  // Sales: query by medicalId only (no orderBy to avoid composite index requirement)
  // Date filtering is done in JavaScript
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const salesQuery = query(
    collection(db, "sales"),
    where("medicalId", "==", medicalId)
  );

  const salesSnapshot = await getDocs(salesQuery);
  const allSales: any[] = salesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter today's sales in JavaScript
  const todaySales = allSales.filter((sale) => {
    const createdAt = new Date(sale.createdAt);
    return createdAt >= todayStart;
  });

  const todaySalesTotal = todaySales.reduce(
    (sum, sale) => sum + (sale.total ?? 0),
    0
  );

  const todayProfit = todaySales.reduce((sum, sale) => {
    const items: any[] = sale.items ?? [];
    const itemProfit = items.reduce(
      (p, item) => p + (item.sellingPrice - (item.purchasePrice ?? 0)) * item.quantity,
      0
    );
    return sum + itemProfit;
  }, 0);

  return {
    todaySales: todaySalesTotal,
    todayProfit,
    lowStockItems,
    nearExpiryItems,
  };
};

export const getWeeklyRevenue = async (
  medicalId: string
): Promise<WeeklyRevenuePoint[]> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  // Simple equality query — no orderBy to avoid composite index requirement
  const q = query(
    collection(db, "sales"),
    where("medicalId", "==", medicalId)
  );

  const snapshot = await getDocs(q);
  const allSales: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Filter last 7 days in JavaScript
  const recentSales = allSales.filter((sale) => {
    const createdAt = new Date(sale.createdAt);
    return createdAt >= weekAgo;
  });

  const dayMap: Record<string, number> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[d.toDateString()] = 0;
  }

  for (const sale of recentSales) {
    const key = new Date(sale.createdAt).toDateString();
    if (dayMap[key] !== undefined) {
      dayMap[key] += sale.total ?? 0;
    }
  }

  const result: WeeklyRevenuePoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      day: dayNames[d.getDay()],
      revenue: Math.round(dayMap[d.toDateString()] ?? 0),
    });
  }

  return result;
};
