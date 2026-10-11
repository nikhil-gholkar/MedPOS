import { useLocation, useNavigate } from "react-router-dom";

import {
  Dashboard,
  Inventory,
  PointOfSale,
  Assessment,
} from "@mui/icons-material";

interface NavTab {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const tabs: NavTab[] = [
  {
    label: "Dashboard",
    path: "/medical",
    icon: <Dashboard />,
  },
  {
    label: "Inventory",
    path: "/medical/inventory",
    icon: <Inventory />,
  },
  {
    label: "POS",
    path: "/medical/pos",
    icon: <PointOfSale />,
  },
  {
    label: "Reports",
    path: "/medical/reports",
    icon: <Assessment />,
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-ink-mute hover:text-ink-soft"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
              <span className="[&>svg]:text-[20px]">{tab.icon}</span>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
