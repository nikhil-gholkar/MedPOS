import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

import { NavLink, useLocation, useNavigate } from "react-router-dom";

import UserProfileCard from "../ui/UserProfileCard";
import AppLogo from "../ui/AppLogo";

import { useAppSelector } from "../../hooks/reduxHooks";
import { logoutUser } from "../../features/auth/logoutUser";

import type { NavigationItem } from "../../types/navigation.types";

interface Props {
  items: NavigationItem[];
  /** Group heading shown above the nav items, e.g. "Pharmacy". */
  label?: string;
}

export default function AppSidebar({ items, label = "Menu" }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="flex h-full w-[232px] flex-col border-r border-line bg-white">
      <div className="flex h-[52px] shrink-0 items-center border-b border-line px-4">
        <AppLogo />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
          {label}
        </p>

        <List disablePadding>
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                selected={active}
                sx={{
                  mb: 0.5,
                  color: active ? "primary.main" : "text.secondary",
                  backgroundColor: active ? "#E7F3F1" : "transparent",
                  "&:hover": { backgroundColor: active ? "#E7F3F1" : "#EEF2F0" },
                  "&.Mui-selected:hover": { backgroundColor: "#E7F3F1" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                  <Icon sx={{ fontSize: 19 }} />
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "13.5px",
                        fontWeight: active ? 600 : 500,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </nav>

      <UserProfileCard
        username={user?.username ?? "User"}
        role={user?.role ?? ""}
        onLogout={handleLogout}
      />
    </div>
  );
}
