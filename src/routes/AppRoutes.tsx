import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";

import MedicalDashboard from "../pages/medical/DashboardPage";
import SuperAdminDashboard from "../pages/superadmin/DashboardPage";

import MedicalLayout from "../layouts/MedicalLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import MedicalsPage from "../pages/superadmin/MedicalsPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

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