import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, post } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const token = localStorage.getItem("carepoint_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const result = await api("/auth/me");
      const currentUser = result.user || result;
      setUser(currentUser);
      localStorage.setItem("carepoint_user", JSON.stringify(currentUser));
    } catch {
      localStorage.removeItem("carepoint_token");
      localStorage.removeItem("carepoint_user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshUser(); }, []);

  async function login(email, password) {
    const result = await post("/auth/login", { email, password });
    const token = result.token || result.accessToken;
    if (!token) throw new Error("Login response did not include a token.");
    localStorage.setItem("carepoint_token", token);
    const currentUser = result.user || (await api("/auth/me")).user;
    setUser(currentUser);
    localStorage.setItem("carepoint_user", JSON.stringify(currentUser));
    setLoading(false);
  }

  async function register(data) {
    return post("/auth/register", data);
  }

  async function logout() {
    try { await post("/auth/logout", {}); } catch { /* local logout still proceeds */ }
    localStorage.removeItem("carepoint_token");
    localStorage.removeItem("carepoint_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
