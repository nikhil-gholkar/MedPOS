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

interface InventoryRecord {
  quantity?: number;
  expiryDate?: string;
}

interface SaleItemRecord {
  sellingPrice?: number;
  purchasePrice?: number;
  quantity?: number;
}

interface SaleRecord {
  createdAt?: string;
  total?: number;
  items?: SaleItemRecord[];
}

const isRecent = (value: string | undefined, since: Date): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= since;
};

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
    ...(doc.data() as InventoryRecord),
  }));

  const lowStockItems = inventory.filter(
    (item) => (item.quantity ?? 0) <= 10
  ).length;

  const nearExpiryItems = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    if (Number.isNaN(expiry.getTime())) return false;
    const diffDays = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  // Sales: query by medicalId only (no orderBy to avoid composite index requirement)
  // Date filtering is done in JavaScript
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const salesQuery = query(
    collection(db, "sales"),
    where("medicalId", "==", medicalId)
  );

  const salesSnapshot = await getDocs(salesQuery);
  const allSales: SaleRecord[] = salesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SaleRecord),
  }));

  // Filter today's sales in JavaScript
  const todaySales = allSales.filter((sale) => isRecent(sale.createdAt, todayStart));

  const todaySalesTotal = todaySales.reduce(
    (sum, sale) => sum + (sale.total ?? 0),
    0
  );

  const todayProfit = todaySales.reduce((sum, sale) => {
    const items = sale.items ?? [];
    const itemProfit = items.reduce(
      (p, item) =>
        p +
        ((item.sellingPrice ?? 0) - (item.purchasePrice ?? 0)) * (item.quantity ?? 0),
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
  const allSales: SaleRecord[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SaleRecord),
  }));

  // Filter last 7 days in JavaScript
  const recentSales = allSales.filter((sale) => isRecent(sale.createdAt, weekAgo));

  const dayMap: Record<string, number> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[d.toDateString()] = 0;
  }

  for (const sale of recentSales) {
    if (!sale.createdAt) continue;
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
