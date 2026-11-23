import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ClientHome, Directory, Medicines, MyRequests } from "./pages/Client";
import { AdminHome, Inventory, MedicineRequests, Appointments } from "./pages/Admin";
import { SuperAdmins, SuperMedicines } from "./pages/SuperAdmin";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading CarePoint…</div>;
  if (!user) return <Navigate to="/login" replace/>;
  return <Navigate to={user.role === "client" ? "/client" : user.role === "super_admin" ? "/super-admin" : "/admin"} replace/>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<HomeRedirect/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route element={<ProtectedRoute roles={["client"]}/>}>
      <Route element={<Layout/>}>
        <Route path="/client" element={<ClientHome/>}/>
        <Route path="/client/directory" element={<Directory/>}/>
        <Route path="/client/medicines" element={<Medicines/>}/>
        <Route path="/client/requests" element={<MyRequests/>}/>
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={["dispensary_admin"]}/>}>
      <Route element={<Layout/>}>
        <Route path="/admin" element={<AdminHome/>}/>
        <Route path="/admin/inventory" element={<Inventory/>}/>
        <Route path="/admin/medicine-requests" element={<MedicineRequests/>}/>
        <Route path="/admin/appointments" element={<Appointments/>}/>
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={["super_admin"]}/>}>
      <Route element={<Layout/>}>
        <Route path="/super-admin" element={<AdminHome/>}/>
        <Route path="/super-admin/admins" element={<SuperAdmins/>}/>
        <Route path="/super-admin/medicines" element={<SuperMedicines/>}/>
      </Route>
    </Route>
    <Route path="*" element={<HomeRedirect/>}/>
  </Routes>;
}
