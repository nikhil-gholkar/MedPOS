import { Navigate } from "react-router-dom";

import { useAppSelector } from "../hooks/reduxHooks";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children,
}: Props) {
  const { isAuthenticated, initialized } =
    useAppSelector(
      (state) => state.auth
    );

  // Firebase Auth resolves asynchronously on page load — don't bounce to
  // the login screen before we know whether a session exists.
  if (!initialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}