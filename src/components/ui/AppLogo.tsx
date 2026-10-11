interface Props {
  /** Reversed treatment for dark surfaces (e.g. the login brand panel). */
  inverted?: boolean;
}

export default function AppLogo({ inverted = false }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-ctl ${
          inverted ? "bg-white/15" : "bg-primary"
        }`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="text-white"
        >
          <rect x="9.75" y="3" width="4.5" height="18" rx="1.5" fill="currentColor" />
          <rect x="3" y="9.75" width="18" height="4.5" rx="1.5" fill="currentColor" />
        </svg>
      </span>

      <div className="leading-tight">
        <p className={`text-sm font-semibold ${inverted ? "text-white" : "text-ink"}`}>
          MedPOS
        </p>
        <p className={`text-[11px] ${inverted ? "text-white/55" : "text-ink-mute"}`}>
          Pharmacy POS
        </p>
      </div>
    </div>
  );
}
