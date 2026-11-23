import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { useAuth } from "../context";
import { Notice } from "../components/UI";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [busy, setBusy] = useState(false);
  function change(e) { setForm({...form, [e.target.name]: e.target.value}); }
  async function submit(e) {
    e.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    try {
      await register(form);
      setSuccess("Account created. You can now sign in.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-page register-page">
    <div className="auth-aside"><div className="brand brand-light"><div className="brand-mark"><Activity size={21}/></div><div><strong>CarePoint</strong><span>Healthcare, connected.</span></div></div><div className="auth-promo"><div className="promo-chip">CLIENT REGISTRATION</div><h1>Your care,<br/><em>within reach.</em></h1><p>Create a client account to discover dispensaries, check medicine availability and track your requests.</p></div><div className="auth-footer">Secure access · Client accounts only</div></div>
    <div className="auth-main"><form className="auth-card" onSubmit={submit}>
      <div className="eyebrow">GET STARTED</div><h2>Create your account</h2><p className="muted">All fields marked required must be completed.</p>
      <Notice>{error}</Notice><Notice type="success">{success}</Notice>
      <label>Full name</label><input className="plain-input" name="fullName" value={form.fullName} onChange={change} required maxLength="100" placeholder="Your full name"/>
      <label>Email address</label><input className="plain-input" type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com"/>
      <label>Phone number <span className="optional">(optional)</span></label><input className="plain-input" name="phone" value={form.phone} onChange={change} placeholder="Phone number"/>
      <label>Password</label><input className="plain-input" type="password" name="password" value={form.password} onChange={change} minLength="8" required placeholder="At least 8 characters"/>
      <button className="primary-button full" disabled={busy}>{busy ? "Creating account…" : "Create client account"} <ArrowRight size={17}/></button>
      <div className="auth-switch">Already registered? <Link to="/login">Sign in</Link></div>
      <div className="auth-footnote">This form creates a client account only. Admin roles cannot be selected here.</div>
    </form></div>
  </div>;
}
