import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 4-up for money KPIs, 3-up for catalogue summaries. */
  cols?: 3 | 4;
}

/**
 * One connected panel holding metric cells, separated by hairlines.
 * Wrap <StatsCard>s in this instead of giving each metric its own card.
 */
export default function StatsStrip({ children, cols = 4 }: Props) {
  return (
    <div
      className={`grid gap-px overflow-hidden rounded-card border border-line bg-line ${
        cols === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 xl:grid-cols-4"
      }`}
    >
      {children}
    </div>
  );
}
