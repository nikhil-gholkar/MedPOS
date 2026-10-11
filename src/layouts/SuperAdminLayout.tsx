import { useState } from "react";
import { Outlet } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import AppDrawer from "../components/layout/AppDrawer";

import { superAdminNavigation } from "../config/navigation";

export default function SuperAdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen md:block">
        <AppSidebar items={superAdminNavigation} label="Platform" />
      </div>

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={superAdminNavigation}
        label="Platform"
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader
          title="Platform console"
          onMenuClick={() => setDrawerOpen(true)}
        />

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
