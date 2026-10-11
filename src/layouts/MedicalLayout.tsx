import { useState } from "react";
import { Outlet } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import AppDrawer from "../components/layout/AppDrawer";
import MobileBottomNav from "../components/layout/MobileBottomNav";

import { medicalNavigation } from "../config/navigation";

export default function MedicalLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen md:block">
        <AppSidebar items={medicalNavigation} label="Pharmacy" />
      </div>

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={medicalNavigation}
        label="Pharmacy"
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader
          title="Pharmacy console"
          onMenuClick={() => setDrawerOpen(true)}
        />

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-6 md:pt-5">
          <Outlet />
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
