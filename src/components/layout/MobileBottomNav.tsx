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
    icon: <Dashboard sx={{ fontSize: 22 }} />,
  },
  {
    label: "Inventory",
    path: "/medical/inventory",
    icon: <Inventory sx={{ fontSize: 22 }} />,
  },
  {
    label: "POS",
    path: "/medical/pos",
    icon: <PointOfSale sx={{ fontSize: 22 }} />,
  },
  {
    label: "Reports",
    path: "/medical/reports",
    icon: <Assessment sx={{ fontSize: 22 }} />,
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 block border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 min-w-0 px-2 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-8 rounded-lg transition-all duration-200 ${
                  isActive ? "bg-blue-50" : ""
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                  isActive ? "text-blue-600" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
