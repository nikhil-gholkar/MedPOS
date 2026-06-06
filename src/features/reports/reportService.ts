import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

import type {
  DailyRevenuePoint,
  CategorySales,
  PaymentMethodBreakdown,
  SalesSummary,
  TopMedicine,
} from "./reportTypes";

import type { SaleTransaction } from "../pos/posTypes";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Fetch all sales for a medical within a date range.
 * Uses a simple equality query (medicalId) + JS date filtering
 * to avoid needing composite Firestore indexes.
 */
export const getSalesInRange = async (
  medicalId: string,
  startDate: Date,
  endDate: Date
): Promise<SaleTransaction[]> => {
  const q = query(
    collection(db, "sales"),
    where("medicalId", "==", medicalId)
  );

  const snapshot = await getDocs(q);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SaleTransaction)
    .filter((sale) => {
      const createdAt = new Date(sale.createdAt);
      return createdAt >= startDate && createdAt <= endOfDay;
    });
};

/** Compute summary statistics from sales */
export const getSalesSummary = async (
  medicalId: string,
  startDate: Date,
  endDate: Date
): Promise<SalesSummary> => {
  const sales = await getSalesInRange(medicalId, startDate, endDate);

  const totalSales = sales.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const totalOrders = sales.length;

  let totalProfit = 0;
  let totalItemsSold = 0;

  for (const sale of sales) {
    const items = sale.items ?? [];
    for (const item of items) {
      totalProfit += (item.sellingPrice - (item.purchasePrice ?? 0)) * item.quantity;
      totalItemsSold += item.quantity;
    }
  }

  return {
    totalSales,
    totalProfit,
    totalItemsSold,
    avgOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
    totalOrders,
  };
};

/** Get daily revenue/profit data for charts */
export const getDailyRevenue = async (
  medicalId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyRevenuePoint[]> => {
  const sales = await getSalesInRange(medicalId, startDate, endDate);

  // Build a map of date -> totals
  const dayMap: Record<string, { revenue: number; profit: number; orders: number }> = {};

  const cursor = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    dayMap[cursor.toDateString()] = { revenue: 0, profit: 0, orders: 0 };
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const sale of sales) {
    const key = new Date(sale.createdAt).toDateString();
    if (dayMap[key]) {
      dayMap[key].revenue += sale.total ?? 0;
      dayMap[key].orders += 1;

      const items = sale.items ?? [];
      for (const item of items) {
        dayMap[key].profit += (item.sellingPrice - (item.purchasePrice ?? 0)) * item.quantity;
      }
    }
  }

  const result: DailyRevenuePoint[] = [];
  const dateCursor = new Date(startDate);
  while (dateCursor <= end) {
    const data = dayMap[dateCursor.toDateString()] ?? { revenue: 0, profit: 0, orders: 0 };
    const dayName = DAY_LABELS[dateCursor.getDay()];
    const monthName = MONTH_LABELS[dateCursor.getMonth()];
    const dayNum = dateCursor.getDate();

    result.push({
      date: dateCursor.toDateString(),
      label: `${dayName}, ${monthName} ${dayNum}`,
      revenue: Math.round(data.revenue),
      profit: Math.round(data.profit ?? 0),
      orders: data.orders,
    });

    dateCursor.setDate(dateCursor.getDate() + 1);
  }

  return result;
};

/** Get top-selling medicines */
export const getTopMedicines = async (
  medicalId: string,
  startDate: Date,
  endDate: Date
): Promise<TopMedicine[]> => {
  const sales = await getSalesInRange(medicalId, startDate, endDate);

  const medicineMap: Record<string, TopMedicine> = {};

  for (const sale of sales) {
    const items = sale.items ?? [];
    for (const item of items) {
      const key = item.medicineId;
      if (!medicineMap[key]) {
        medicineMap[key] = {
          medicineName: item.medicineName,
          genericName: item.genericName ?? "",
          category: "",
          quantitySold: 0,
          totalRevenue: 0,
          totalProfit: 0,
        };
      }

      medicineMap[key].quantitySold += item.quantity;
      medicineMap[key].totalRevenue += item.sellingPrice * item.quantity;
      medicineMap[key].totalProfit += (item.sellingPrice - (item.purchasePrice ?? 0)) * item.quantity;
    }
  }

  return Object.values(medicineMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/** Get sales breakdown by category */
export const getCategorySales = async (
  medicalId: string,
  startDate: Date,
  endDate: Date
): Promise<CategorySales[]> => {
  const sales = await getSalesInRange(medicalId, startDate, endDate);

  const catMap: Record<string, CategorySales> = {};

  for (const sale of sales) {
    const items = sale.items ?? [];
    for (const item of items) {
      const category = (item as any).category ?? "Other";
      if (!catMap[category]) {
        catMap[category] = { category, totalRevenue: 0, totalProfit: 0, itemsSold: 0 };
      }

      catMap[category].totalRevenue += item.sellingPrice * item.quantity;
      catMap[category].totalProfit += (item.sellingPrice - (item.purchasePrice ?? 0)) * item.quantity;
      catMap[category].itemsSold += item.quantity;
    }
  }

  return Object.values(catMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/** Get payment method breakdown */
export const getPaymentMethodBreakdown = async (
  medicalId: string,
  startDate: Date,
  endDate: Date
): Promise<PaymentMethodBreakdown[]> => {
  const sales = await getSalesInRange(medicalId, startDate, endDate);

  const methodMap: Record<string, PaymentMethodBreakdown> = {};

  for (const sale of sales) {
    const method = sale.paymentMethod ?? "other";
    if (!methodMap[method]) {
      methodMap[method] = { method, totalRevenue: 0, count: 0 };
    }

    methodMap[method].totalRevenue += sale.total ?? 0;
    methodMap[method].count += 1;
  }

  return Object.values(methodMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/** Export helpers — convert report data to CSV/table format */
export const salesToCsvRows = (
  sales: SaleTransaction[]
): Record<string, string | number>[] => {
  const rows: Record<string, string | number>[] = [];

  for (const sale of sales) {
    for (const item of sale.items ?? []) {
      rows.push({
        "Sale ID": sale.id,
        Date: new Date(sale.createdAt).toLocaleString("en-IN"),
        Medicine: item.medicineName,
        "Generic Name": item.genericName ?? "",
        Quantity: item.quantity,
        "Unit Price": item.sellingPrice,
        Subtotal: item.subtotal,
        "Purchase Price": item.purchasePrice ?? 0,
        Profit: (item.sellingPrice - (item.purchasePrice ?? 0)) * item.quantity,
        "Payment Method": sale.paymentMethod,
        "Customer Name": sale.customerName ?? "",
        "Customer Phone": sale.customerPhone ?? "",
      });
    }
  }

  return rows;
};

export const topMedicinesToCsvRows = (
  medicines: TopMedicine[]
): Record<string, string | number>[] => {
  return medicines.map((m, i) => ({
    "#": i + 1,
    Medicine: m.medicineName,
    "Generic Name": m.genericName,
    "Quantity Sold": m.quantitySold,
    Revenue: m.totalRevenue,
    Profit: m.totalProfit,
    "Margin %": m.totalRevenue > 0
      ? `${Math.round((m.totalProfit / m.totalRevenue) * 100)}%`
      : "0%",
  }));
};
