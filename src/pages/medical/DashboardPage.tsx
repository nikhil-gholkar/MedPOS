import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  TrendingUp,
  WarningAmber,
  AccessTime,
  Inventory2,
  ChevronRight,
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

import { Skeleton } from "@mui/material";

import PageHeader from "../../components/ui/PageHeader";
import StatsCard from "../../components/ui/StatsCard";
import StatsStrip from "../../components/ui/StatsStrip";
import { getMedicalDashboardStats, getWeeklyRevenue } from "../../features/dashboard/medicalDashboardService";
import type { WeeklyRevenuePoint } from "../../features/dashboard/medicalDashboardService";
import { useAppSelector } from "../../hooks/reduxHooks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-ctl border border-line bg-white px-3 py-2 shadow-[0_4px_12px_rgba(16,32,28,0.08)]">
        <p className="text-[11px] font-medium text-ink-mute">{label}</p>
        <p className="tnum text-[15px] font-semibold text-ink">
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

const EMPTY_WEEK: WeeklyRevenuePoint[] = [
  { day: "Mon", revenue: 0 },
  { day: "Tue", revenue: 0 },
  { day: "Wed", revenue: 0 },
  { day: "Thu", revenue: 0 },
  { day: "Fri", revenue: 0 },
  { day: "Sat", revenue: 0 },
  { day: "Sun", revenue: 0 },
];

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const medicalId = user?.medicalId;
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    lowStockItems: 0,
    nearExpiryItems: 0,
  });
  const [chartData, setChartData] = useState<WeeklyRevenuePoint[]>(EMPTY_WEEK);

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
    } finally {
      setLoaded(true);
    }
  }, [medicalId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state updates run after the fetch resolves
    loadDashboard();
  }, [loadDashboard]);

  // Refresh when the tab regains focus (e.g. navigating back from the POS)
  useEffect(() => {
    const onFocus = () => loadDashboard();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadDashboard]);

  const weekRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const hasWeekData = weekRevenue > 0;
  const marginPct =
    stats.todaySales > 0
      ? Math.round((stats.todayProfit / stats.todaySales) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's sales, stock health and expiry alerts"
      />

      {!loaded ? (
        <StatsStrip>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={110} sx={{ bgcolor: "#EDF1EF" }} />
          ))}
        </StatsStrip>
      ) : (
        <StatsStrip>
          <StatsCard
            title="Sales today"
            value={`₹${stats.todaySales.toLocaleString("en-IN")}`}
            icon={<ShoppingCart sx={{ fontSize: 18 }} />}
            hint="Recorded since midnight"
          />
          <StatsCard
            title="Profit today"
            value={`₹${stats.todayProfit.toLocaleString("en-IN")}`}
            icon={<TrendingUp sx={{ fontSize: 18 }} />}
            tone={stats.todaySales > 0 ? "ok" : "neutral"}
            hint={
              stats.todaySales > 0
                ? `${marginPct}% of today's sales`
                : "No sales recorded yet"
            }
          />
          <StatsCard
            title="Low stock"
            value={stats.lowStockItems}
            icon={<Inventory2 sx={{ fontSize: 18 }} />}
            tone={stats.lowStockItems > 0 ? "warn" : "ok"}
            hint={
              stats.lowStockItems > 0
                ? "Items at or below 10 units"
                : "All items sufficiently stocked"
            }
          />
          <StatsCard
            title="Expiring ≤ 30 days"
            value={stats.nearExpiryItems}
            icon={<AccessTime sx={{ fontSize: 18 }} />}
            tone={stats.nearExpiryItems > 0 ? "danger" : "ok"}
            hint={
              stats.nearExpiryItems > 0
                ? "Review batches before they lapse"
                : "No expiry alerts"
            }
          />
        </StatsStrip>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {/* Revenue trend */}
        <section className="rounded-card border border-line bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 md:px-5">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Revenue</h2>
              <p className="mt-0.5 text-xs text-ink-soft">Last 7 days</p>
            </div>
            <p className="tnum text-[15px] font-semibold text-ink">
              ₹{weekRevenue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="h-[280px] w-full px-2 py-4">
            {!loaded ? (
              <Skeleton variant="rectangular" height="100%" sx={{ mx: 2, bgcolor: "#EDF1EF" }} />
            ) : hasWeekData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F766E" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EF" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A968F" }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A968F" }} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#D4DAD7" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F766E"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                    dot={false}
                    activeDot={{ r: 3.5, fill: "#0F766E" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-ink">No sales this week</p>
                <p className="mt-1 text-xs text-ink-soft">
                  The revenue trend appears once sales are recorded at the counter.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Attention queue */}
        <section className="rounded-card border border-line bg-white">
          <div className="border-b border-line px-4 py-3 md:px-5">
            <h2 className="text-[15px] font-semibold text-ink">Needs attention</h2>
            <p className="mt-0.5 text-xs text-ink-soft">Stock and expiry alerts</p>
          </div>

          {!loaded ? (
            <div className="space-y-px">
              <Skeleton variant="rectangular" height={64} sx={{ bgcolor: "#EDF1EF" }} />
              <Skeleton variant="rectangular" height={64} sx={{ bgcolor: "#EDF1EF" }} />
            </div>
          ) : stats.lowStockItems === 0 && stats.nearExpiryItems === 0 ? (
            <div className="px-4 py-10 text-center md:px-5">
              <p className="text-sm font-medium text-ink">All clear</p>
              <p className="mt-1 text-xs text-ink-soft">
                No low stock or expiry alerts right now.
              </p>
            </div>
          ) : (
            <div>
              {stats.lowStockItems > 0 && (
                <button
                  onClick={() => navigate("/medical/inventory")}
                  className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left transition-colors hover:bg-canvas md:px-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl bg-warn-soft text-warn">
                    <WarningAmber sx={{ fontSize: 18 }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink">
                      Low stock
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {stats.lowStockItems} item{stats.lowStockItems !== 1 ? "s" : ""} at or below 10 units
                    </span>
                  </span>
                  <ChevronRight sx={{ fontSize: 18, color: "#8A968F" }} />
                </button>
              )}

              {stats.nearExpiryItems > 0 && (
                <button
                  onClick={() => navigate("/medical/inventory")}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-canvas md:px-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl bg-danger-soft text-danger">
                    <AccessTime sx={{ fontSize: 18 }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink">
                      Near expiry
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {stats.nearExpiryItems} item{stats.nearExpiryItems !== 1 ? "s" : ""} expire within 30 days
                    </span>
                  </span>
                  <ChevronRight sx={{ fontSize: 18, color: "#8A968F" }} />
                </button>
              )}

              <div className="border-t border-line p-3">
                <button
                  onClick={() => navigate("/medical/inventory")}
                  className="w-full rounded-ctl border border-line-strong py-2 text-[13px] font-semibold text-ink transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-strong"
                >
                  Open inventory
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
