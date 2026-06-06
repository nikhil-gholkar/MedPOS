import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

import type { NavigationItem } from "../types/navigation.types";

export const medicalNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/medical",
    icon: DashboardIcon,
  },
  {
    label: "Inventory",
    path: "/medical/inventory",
    icon: InventoryIcon,
  },
  {
    label: "POS",
    path: "/medical/pos",
    icon: PointOfSaleIcon,
  },
  {
    label: "Reports",
    path: "/medical/reports",
    icon: AssessmentIcon,
  },
  {
    label: "Suppliers",
    path: "/medical/suppliers",
    icon: LocalShippingIcon,
  },
  {
    label: "Settings",
    path: "/medical/settings",
    icon: SettingsIcon,
  },
];

export const superAdminNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/superadmin",
    icon: DashboardIcon,
  },
  {
    label: "Medicals",
    path: "/superadmin/medicals",
    icon: LocalHospitalIcon,
  },
];