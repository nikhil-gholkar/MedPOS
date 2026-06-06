import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  NavLink,
  useLocation,
} from "react-router-dom";
import { useNavigate } from "react-router-dom";

import UserProfileCard from "../ui/UserProfileCard";

import { useAppSelector } from "../../hooks/reduxHooks";

import { clearUser } from "../../utils/authStorage";

import AppLogo from "../ui/AppLogo";

import type {
  NavigationItem,
} from "../../types/navigation.types";

interface Props {
  items: NavigationItem[];
}

export default function AppSidebar({
  items,
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();

const user = useAppSelector(
  (state) => state.auth.user
);

const handleLogout = () => {
  clearUser();

  navigate("/login");
};

  return (
   <div
  className="
  flex
  h-screen
  w-[280px]
  flex-col
  border-r
  bg-white
  p-4
"
>
      <AppLogo />

      <div className="mt-8">

        <p
          className="
          mb-3
          px-3
          text-xs
          font-semibold
          uppercase
          text-gray-400
        "
        >
          Management
        </p>

        <List>

          {items.map((item) => {
            const Icon =
              item.icon;

            const active =
              location.pathname ===
              item.path;

            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 3,
                  mb: 1,

                  backgroundColor:
                    active
                      ? "#EFF6FF"
                      : "transparent",
                }}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                />
              </ListItemButton>
            );
          })}

        </List>

      </div>
    <UserProfileCard
  username={user?.username ?? "User"}
  role={user?.role ?? ""}
  onLogout={handleLogout}
/>

</div>
    
  );
}