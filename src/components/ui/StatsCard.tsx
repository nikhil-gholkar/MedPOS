import type { ReactNode } from "react";

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
}

export default function StatsCard({
  title,
  value,
  icon,
}: Props) {
  return (
    <div
      className="
      rounded-2xl
      bg-white
      p-5
      shadow-sm
      border
      hover:shadow-md
      transition
    "
    >
      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {value}
          </h2>

        </div>

        <div
          className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          bg-blue-50
        "
        >
          {icon}
        </div>

      </div>
    </div>
  );
}