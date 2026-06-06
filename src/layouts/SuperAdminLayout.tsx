import { useState } from "react";
import { Outlet } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import AppDrawer from "../components/layout/AppDrawer";


import { superAdminNavigation } from "../config/navigation";

export default function SuperAdminLayout() {


  const [drawerOpen, setDrawerOpen] =
    useState(false);



  return (
    <div className="flex">

      <div className="hidden md:block">
        <AppSidebar
          items={superAdminNavigation}
        />
      </div>

      <AppDrawer
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
        items={superAdminNavigation}
      />

      <div className="flex-1">

        <AppHeader
  title="Medical Dashboard"
  onMenuClick={() =>
    setDrawerOpen(true)
  }
/>

        <div className="p-5">
          <Outlet />
        </div>

      </div>

    </div>
  );
}