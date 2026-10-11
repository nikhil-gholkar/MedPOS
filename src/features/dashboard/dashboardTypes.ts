export interface MonthlyGrowthPoint {
  month: string;
  count: number;
}

export interface RecentStore {
  id: string;
  medicalName: string;
  ownerName: string;
  createdAt: string;
}

export interface DashboardStats {
  totalMedicals: number;
  activeMedicals: number;
  inactiveMedicals: number;
  todayAdded: number;
  /** Store count registered per month for the last 6 months. */
  monthlyGrowth: MonthlyGrowthPoint[];
  /** Five most recent registrations. */
  recentStores: RecentStore[];
}
