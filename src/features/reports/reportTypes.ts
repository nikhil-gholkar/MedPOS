export interface ReportFilters {
  startDate: Date;
  endDate: Date;
}

export interface SalesSummary {
  totalSales: number;
  totalProfit: number;
  totalItemsSold: number;
  avgOrderValue: number;
  totalOrders: number;
}

export interface TopMedicine {
  medicineName: string;
  genericName: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface CategorySales {
  category: string;
  totalRevenue: number;
  totalProfit: number;
  itemsSold: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  totalRevenue: number;
  count: number;
}

export interface DailyRevenuePoint {
  date: string;
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}
