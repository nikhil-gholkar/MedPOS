interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>

        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        {subtitle && (
          <p className="text-gray-500">
            {subtitle}
          </p>
        )}

      </div>

      {action}

    </div>
  );
}