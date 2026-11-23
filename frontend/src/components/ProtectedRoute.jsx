import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context";

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading your workspace…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === "client") return <Navigate to="/client" replace />;
    return <Navigate to={user.role === "super_admin" ? "/super-admin" : "/admin"} replace />;
  }
  return <Outlet />;
}
