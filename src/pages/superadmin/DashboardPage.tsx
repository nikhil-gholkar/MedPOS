import { useEffect, useState } from "react";

import {
  Store,
  CheckCircle,
  Block,
  PersonAdd,
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

import StatsCard from "../../components/ui/StatsCard";
import StatsStrip from "../../components/ui/StatsStrip";
import PageHeader from "../../components/ui/PageHeader";

import { getDashboardStats } from "../../features/dashboard/dashboardService";
import type { DashboardStats } from "../../features/dashboard/dashboardTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-ctl border border-line bg-white px-3 py-2 shadow-[0_4px_12px_rgba(16,32,28,0.08)]">
        <p className="text-[11px] font-medium text-ink-mute">{label}</p>
        <p className="tnum text-[15px] font-semibold text-ink">
          {payload[0].value} store{payload[0].value === 1 ? "" : "s"} registered
        </p>
      </div>
    );
  }
  return null;
};

const EMPTY_STATS: DashboardStats = {
  totalMedicals: 0,
  activeMedicals: 0,
  inactiveMedicals: 0,
  todayAdded: 0,
  monthlyGrowth: [],
  recentStores: [],
};

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Store registrations and status across the platform"
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
            title="Total stores"
            value={stats.totalMedicals}
            icon={<Store sx={{ fontSize: 18 }} />}
            hint="Registered pharmacies"
          />
          <StatsCard
            title="Active"
            value={stats.activeMedicals}
            icon={<CheckCircle sx={{ fontSize: 18 }} />}
            tone={stats.activeMedicals > 0 ? "ok" : "neutral"}
            hint={
              stats.totalMedicals > 0
                ? `${Math.round((stats.activeMedicals / stats.totalMedicals) * 100)}% of all stores`
                : "No stores yet"
            }
          />
          <StatsCard
            title="Inactive"
            value={stats.inactiveMedicals}
            icon={<Block sx={{ fontSize: 18 }} />}
            tone={stats.inactiveMedicals > 0 ? "warn" : "neutral"}
            hint={stats.inactiveMedicals > 0 ? "Access currently suspended" : "None suspended"}
          />
          <StatsCard
            title="Added today"
            value={stats.todayAdded}
            icon={<PersonAdd sx={{ fontSize: 18 }} />}
            hint="Since midnight"
          />
        </StatsStrip>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {/* Growth chart — real registration counts */}
        <section className="rounded-card border border-line bg-white xl:col-span-2">
          <div className="border-b border-line px-4 py-3 md:px-5">
            <h2 className="text-[15px] font-semibold text-ink">Store growth</h2>
            <p className="mt-0.5 text-xs text-ink-soft">New registrations per month, last 6 months</p>
          </div>

          <div className="h-[300px] w-full px-2 py-4">
            {!loaded ? (
              <Skeleton variant="rectangular" height="100%" sx={{ mx: 2, bgcolor: "#EDF1EF" }} />
            ) : stats.monthlyGrowth.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] text-ink-soft">No registration data yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyGrowth} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="storeGrowthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F766E" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF1EF" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A968F" }} dy={6} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A968F" }} width={32} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#D4DAD7" }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0F766E"
                    strokeWidth={2}
                    fill="url(#storeGrowthFill)"
                    dot={false}
                    activeDot={{ r: 3.5, fill: "#0F766E" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Recent registrations */}
        <section className="rounded-card border border-line bg-white">
          <div className="border-b border-line px-4 py-3 md:px-5">
            <h2 className="text-[15px] font-semibold text-ink">Recent registrations</h2>
            <p className="mt-0.5 text-xs text-ink-soft">Newest stores on the platform</p>
          </div>

          {!loaded ? (
            <div>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={56} sx={{ bgcolor: "#EDF1EF" }} />
              ))}
            </div>
          ) : stats.recentStores.length === 0 ? (
            <div className="px-4 py-10 text-center md:px-5">
              <p className="text-sm font-medium text-ink">No stores yet</p>
              <p className="mt-1 text-xs text-ink-soft">
                Registered stores will appear here in order of sign-up.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentStores.map((store) => (
                <li key={store.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl bg-canvas text-ink-soft">
                    <Store sx={{ fontSize: 17 }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {store.medicalName}
                    </p>
                    <p className="truncate text-xs text-ink-soft">{store.ownerName}</p>
                  </div>
                  <span className="tnum shrink-0 text-[12px] text-ink-mute">
                    {formatShortDate(store.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
