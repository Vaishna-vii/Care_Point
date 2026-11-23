import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, Search, ClipboardList, Package, CalendarDays, LogOut, ShieldCheck, Stethoscope, Users, Pill } from "lucide-react";
import { useAuth } from "../context";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "dispensary_admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const clientLinks = [
    ["/client", "Overview", LayoutDashboard],
    ["/client/directory", "Find dispensaries", Search],
    ["/client/medicines", "Medicine availability", Package],
    ["/client/requests", "My requests", ClipboardList]
  ];
  const adminLinks = [
    ["/admin", "Overview", LayoutDashboard],
    ["/admin/inventory", "Inventory", Package],
    ["/admin/medicine-requests", "Medicine requests", ClipboardList],
    ["/admin/appointments", "Appointments", CalendarDays]
  ];
  const superAdminLinks = [["/super-admin", "Platform overview", LayoutDashboard],["/super-admin/admins", "Dispensary admins", Users],["/super-admin/medicines", "Medicine catalogue", Pill]];
  const links = isSuperAdmin ? superAdminLinks : (isAdmin ? adminLinks : clientLinks);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={21} /></div>
          <div><strong>CarePoint</strong><span>Dispensary network</span></div>
        </div>
        <div className="nav-label">{isAdmin ? "WORKSPACE" : "CLIENT PORTAL"}</div>
        <nav className="side-nav">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/client" || to === "/admin"} className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
          {user?.role === "super_admin" && (
            <div className="nav-note"><ShieldCheck size={15}/> Super-admin view</div>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">{(user?.full_name || user?.name || "U").slice(0,1).toUpperCase()}</div>
            <div className="profile-copy"><strong>{user?.full_name || user?.name || "User"}</strong><span>{(user?.role || "client").replaceAll("_", " ")}</span></div>
          </div>
          <button className="logout-button" onClick={handleLogout}><LogOut size={17}/> Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-kicker"><Stethoscope size={16}/> Healthcare Dispensary Management</div>
          <div className="topbar-right"><span className="status-dot"/> Connected workspace</div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
