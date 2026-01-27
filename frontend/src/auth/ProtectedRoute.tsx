import { Navigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "./auth";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: string[];
}) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const user = getCurrentUser();
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // If user is logged in but doesn't have the required role,
    // we should ideally redirect to their own dashboard or an unauthorized page.
    return <Navigate to="/" replace />;
  }

  return children;
}