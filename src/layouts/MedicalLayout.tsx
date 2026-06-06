import { useState } from "react";
import { Outlet } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import AppDrawer from "../components/layout/AppDrawer";
import MobileBottomNav from "../components/layout/MobileBottomNav";

import { medicalNavigation } from "../config/navigation";

export default function MedicalLayout() {
  const [drawerOpen, setDrawerOpen] =
    useState(false);

  return (
    <div className="flex">

      <div className="hidden md:block">
        <AppSidebar
          items={medicalNavigation}
        />
      </div>

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={medicalNavigation}
      />

      <div className="flex flex-1 flex-col min-h-screen">

        <AppHeader
          title="Medical Dashboard"
          onMenuClick={() => setDrawerOpen(true)}
        />

        <div className="flex-1 p-5 pb-20 md:pb-5">
          <Outlet />
        </div>

        <MobileBottomNav />

      </div>

    </div>
  );
}