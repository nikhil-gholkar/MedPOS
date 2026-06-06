import { Drawer } from "@mui/material";

import AppSidebar from "./AppSidebar";

import type {
  NavigationItem,
} from "../../types/navigation.types";

interface Props {
  open: boolean;
  onClose: () => void;
  items: NavigationItem[];
}

export default function AppDrawer({
  open,
  onClose,
  items,
}: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 280,
          },
        },
      }}
    >
      <AppSidebar items={items} />
    </Drawer>
  );
}