import type { ReactNode } from "react";

interface Props {
  title: string;
  value: ReactNode;
  /** Small explanatory line under the value — status or context, never decoration. */
  hint?: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger";
  icon?: ReactNode;
}

const hintTone = {
  neutral: "text-ink-mute",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
} as const;

/**
 * A single metric cell. Cells are placed inside a <StatsStrip> so a row of
 * metrics reads as one instrument panel instead of separate floating cards.
 */
export default function StatsCard({ title, value, hint, tone = "neutral", icon }: Props) {
  return (
    <div className="bg-white p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
          {title}
        </p>
        {icon && <span className="shrink-0 text-ink-mute">{icon}</span>}
      </div>

      <p className="tnum mt-2 text-[26px] font-semibold leading-none tracking-tight text-ink">
        {value}
      </p>

      {hint && <p className={`mt-2 text-xs ${hintTone[tone]}`}>{hint}</p>}
    </div>
  );
}
