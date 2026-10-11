interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-soft">{subtitle}</p>}
      </div>

      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
