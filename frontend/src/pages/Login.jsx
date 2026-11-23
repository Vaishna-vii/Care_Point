import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context";
import { Notice } from "../components/UI";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      const current = JSON.parse(localStorage.getItem("carepoint_user") || "null");
      navigate(current?.role === "client" ? "/client" : current?.role === "super_admin" ? "/super-admin" : "/admin");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="auth-page">
    <div className="auth-aside">
      <div className="brand brand-light"><div className="brand-mark"><Activity size={21}/></div><div><strong>CarePoint</strong><span>Healthcare, connected.</span></div></div>
      <div className="auth-promo"><div className="promo-chip">DISPENSARY MANAGEMENT PLATFORM</div><h1>Better access.<br/><em>Better care.</em></h1><p>Find dispensaries, explore healthcare services and manage medicine requests in one place.</p><div className="promo-stat"><span>01</span> Connected dispensary directory</div><div className="promo-stat"><span>02</span> Transparent request tracking</div><div className="promo-stat"><span>03</span> Responsible inventory management</div></div>
      <div className="auth-footer">A student DBMS project · MySQL powered</div>
    </div>
    <div className="auth-main">
      <form className="auth-card" onSubmit={submit}>
        <div className="eyebrow">WELCOME BACK</div><h2>Sign in to CarePoint</h2><p className="muted">Enter your account details to continue.</p>
        <Notice>{error}</Notice>
        <label>Email address</label><div className="input-wrap"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <label>Password</label><div className="input-wrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required /></div>
        <button className="primary-button full" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ArrowRight size={17}/></button>
        <div className="auth-switch">New to CarePoint? <Link to="/register">Create a client account</Link></div>
        <div className="auth-footnote">Administrator accounts are created by the Super Admin. Public admin registration is disabled.</div>
      </form>
    </div>
  </div>;
}
