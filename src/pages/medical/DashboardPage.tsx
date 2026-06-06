import { useEffect, useState, useCallback } from "react";

import {
  ShoppingCart,
  TrendingUp,
  WarningAmber,
  AccessTime,
  Inventory,
  ShowChart,
} from "@mui/icons-material";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import PageHeader from "../../components/ui/PageHeader";
import StatsCard from "../../components/ui/StatsCard";
import { getMedicalDashboardStats, getWeeklyRevenue } from "../../features/dashboard/medicalDashboardService";
import type { WeeklyRevenuePoint } from "../../features/dashboard/medicalDashboardService";
import { useAppSelector } from "../../hooks/reduxHooks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const medicalId = user?.medicalId;

  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    lowStockItems: 0,
    nearExpiryItems: 0,
  });

  const [chartData, setChartData] = useState<WeeklyRevenuePoint[]>([
    { day: "Mon", revenue: 0 },
    { day: "Tue", revenue: 0 },
    { day: "Wed", revenue: 0 },
    { day: "Thu", revenue: 0 },
    { day: "Fri", revenue: 0 },
    { day: "Sat", revenue: 0 },
    { day: "Sun", revenue: 0 },
  ]);

  const loadDashboard = useCallback(async () => {
    if (!medicalId) return;
    try {
      const [statsData, revenueData] = await Promise.all([
        getMedicalDashboardStats(medicalId),
        getWeeklyRevenue(medicalId),
      ]);
      setStats(statsData);
      if (revenueData.length > 0) setChartData(revenueData);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }, [medicalId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Refresh data when the page gains focus (e.g. navigating back from POS)
  useEffect(() => {
    const onFocus = () => loadDashboard();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadDashboard]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your pharmacy performance"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Today's Sales"
          value={`₹${stats.todaySales.toLocaleString()}`}
          icon={<ShoppingCart />}
          variant="blue"
          trend="+12%"
          trendUp={true}
        />
        <StatsCard
          title="Today's Profit"
          value={`₹${stats.todayProfit.toLocaleString()}`}
          icon={<TrendingUp />}
          variant="green"
          trend="+8%"
          trendUp={true}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<WarningAmber />}
          variant="amber"
          trend={stats.lowStockItems > 5 ? "Needs attention" : "OK"}
          trendUp={stats.lowStockItems <= 5}
        />
        <StatsCard
          title="Near Expiry"
          value={stats.nearExpiryItems}
          icon={<AccessTime />}
          variant="red"
          trend={stats.nearExpiryItems > 3 ? "Urgent" : "OK"}
          trendUp={stats.nearExpiryItems <= 3}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weekly Revenue</h3>
              <p className="mt-1 text-sm text-slate-500">Revenue trend for this week</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5">
              <ShowChart sx={{ fontSize: 16, color: "#059669" }} />
              <span className="text-xs font-medium text-emerald-700">+15.2%</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <WarningAmber sx={{ fontSize: 16, color: "#DC2626" }} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Alerts</h3>
          </div>
          <div className="space-y-4">
            <div className="group rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-red-50/50 p-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 transition-transform group-hover:scale-110">
                    <Inventory sx={{ fontSize: 20, color: "#DC2626" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.lowStockItems}</p>
                  </div>
                </div>
                {stats.lowStockItems > 0 && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">Action needed</span>
                )}
              </div>
            </div>
            <div className="group rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-50/50 p-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 transition-transform group-hover:scale-110">
                    <AccessTime sx={{ fontSize: 20, color: "#D97706" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Near Expiry</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.nearExpiryItems}</p>
                  </div>
                </div>
                {stats.nearExpiryItems > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Check now</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button className="w-full rounded-lg bg-slate-50 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              View All Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
