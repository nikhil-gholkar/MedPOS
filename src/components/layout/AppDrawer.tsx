import { Drawer } from "@mui/material";

import AppSidebar from "./AppSidebar";

import type { NavigationItem } from "../../types/navigation.types";

interface Props {
  open: boolean;
  onClose: () => void;
  items: NavigationItem[];
  label?: string;
}

export default function AppDrawer({ open, onClose, items, label }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: 232 },
        },
      }}
    >
      <AppSidebar items={items} label={label} />
    </Drawer>
  );
}
