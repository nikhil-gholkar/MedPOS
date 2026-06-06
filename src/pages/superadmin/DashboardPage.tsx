import {
  useEffect,
  useState,
} from "react";

import {
  Store,
  CheckCircle,
  Block,
  PersonAdd,
} from "@mui/icons-material";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import StatsCard from "../../components/ui/StatsCard";

import PageHeader from "../../components/ui/PageHeader";

import {
  getDashboardStats,
} from "../../features/dashboard/dashboardService";

const chartData = [
  {
    month: "Jan",
    value: 4,
  },
  {
    month: "Feb",
    value: 8,
  },
  {
    month: "Mar",
    value: 11,
  },
  {
    month: "Apr",
    value: 15,
  },
  {
    month: "May",
    value: 19,
  },
  {
    month: "Jun",
    value: 25,
  },
];

export default function DashboardPage() {
  const [stats, setStats] =
    useState({
      totalMedicals: 0,
      activeMedicals: 0,
      inactiveMedicals: 0,
      todayAdded: 0,
    });

  useEffect(() => {
    const load = async () => {
      const data =
        await getDashboardStats();

      setStats(data);
    };

    load();
  }, []);

  return (
    <div>

      <PageHeader
        title="Welcome Back 👋"
        subtitle="Manage all registered medical stores"
      />

      <div
        className="
        grid
        gap-5
        sm:grid-cols-2
        xl:grid-cols-4
      "
      >
        <StatsCard
          title="Total Medicals"
          value={
            stats.totalMedicals
          }
          icon={<Store />}
        />

        <StatsCard
          title="Active Medicals"
          value={
            stats.activeMedicals
          }
          icon={<CheckCircle />}
        />

        <StatsCard
          title="Inactive Medicals"
          value={
            stats.inactiveMedicals
          }
          icon={<Block />}
        />

        <StatsCard
          title="Added Today"
          value={
            stats.todayAdded
          }
          icon={<PersonAdd />}
        />
      </div>

      <div
        className="
        mt-6
        grid
        gap-6
        xl:grid-cols-3
      "
      >

        <div
          className="
          rounded-2xl
          border
          bg-white
          p-5
          xl:col-span-2
        "
        >
          <h3
            className="
            mb-5
            text-lg
            font-semibold
          "
          >
            Medical Growth
          </h3>

          <div
            className="
            h-[350px]
          "
          >
            <ResponsiveContainer>
              <LineChart
                data={chartData}
              >
                <XAxis
                  dataKey="month"
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div
          className="
          rounded-2xl
          border
          bg-white
          p-5
        "
        >
          <h3
            className="
            mb-4
            text-lg
            font-semibold
          "
          >
            Quick Summary
          </h3>

          <div className="space-y-4">

            <div>
              <p className="text-sm text-gray-500">
                Active Stores
              </p>

              <h2 className="text-xl font-bold">
                {
                  stats.activeMedicals
                }
              </h2>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Inactive Stores
              </p>

              <h2 className="text-xl font-bold">
                {
                  stats.inactiveMedicals
                }
              </h2>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                New Today
              </p>

              <h2 className="text-xl font-bold">
                {
                  stats.todayAdded
                }
              </h2>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}