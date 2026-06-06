import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";

import MedicalDashboard from "../pages/medical/DashboardPage";
import POSPage from "../pages/medical/POSPage";
import SuperAdminDashboard from "../pages/superadmin/DashboardPage";

import MedicalLayout from "../layouts/MedicalLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import MedicalsPage from "../pages/superadmin/MedicalsPage";
import InventoryPage from "../pages/medical/InventoryPage";
import ReportsPage from "../pages/medical/ReportsPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<LoginPage />}
        />
         <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/medical"
          element={
            <ProtectedRoute>
              <RoleRoute role="medical">
                <MedicalLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<MedicalDashboard />}
          />
          <Route
            path="inventory"
            element={<InventoryPage />}
          />
          <Route
            path="pos"
            element={<POSPage />}
          />
          <Route
            path="reports"
            element={<ReportsPage />}
          />
        </Route>

        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <RoleRoute role="superadmin">
                <SuperAdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<SuperAdminDashboard />}
          />
          <Route
  path="medicals"
  element={<MedicalsPage />}
/>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}