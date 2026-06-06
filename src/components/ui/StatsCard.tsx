import type { ReactNode } from "react";

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  variant?: "blue" | "green" | "amber" | "red";
}

const variants = {
  blue: {
    lightBg: "bg-blue-50",
    iconColor: "text-blue-600",
    accentBg: "bg-blue-500",
    glow: "hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]",
  },
  green: {
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    accentBg: "bg-emerald-500",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
  },
  amber: {
    lightBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accentBg: "bg-amber-500",
    glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
  },
  red: {
    lightBg: "bg-red-50",
    iconColor: "text-red-600",
    accentBg: "bg-red-500",
    glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]",
  },
};

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendUp = true,
  variant = "blue",
}: Props) {
  const v = variants[variant];

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-2xl bg-white
        p-6
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        border border-slate-100
        transition-all duration-300 ease-out
        hover:-translate-y-1
        ${v.glow}
      `}
    >
      <div
        className={`
          absolute -right-6 -top-6
          h-24 w-24
          rounded-full
          opacity-10
          ${v.accentBg}
        `}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>

          {trend && (
            <div
              className={`
                mt-2 inline-flex items-center gap-1
                rounded-full px-2.5 py-0.5
                text-xs font-medium
                ${trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}
              `}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={trendUp ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                />
              </svg>
              {trend}
            </div>
          )}
        </div>

        <div
          className={`
            flex h-12 w-12
            items-center justify-center
            rounded-xl
            ${v.lightBg}
            ${v.iconColor}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}