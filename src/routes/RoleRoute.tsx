import { Navigate } from "react-router-dom";

import { useAppSelector } from "../hooks/reduxHooks";

interface Props {
  children: React.ReactNode;
  role: "superadmin" | "medical";
}

export default function RoleRoute({
  children,
  role,
}: Props) {
  const { user, initialized } = useAppSelector(
    (state) => state.auth
  );

  // Wait for Firebase Auth's first auth-state event (see authInitializer).
  if (!initialized) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}