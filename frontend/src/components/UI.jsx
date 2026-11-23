import React from "react";

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div>{action}</div>}
  </div>;
}

export function StatCard({ label, value, hint, icon: Icon }) {
  return <div className="stat-card">
    <div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={18}/></div></div>
    <div className="stat-value">{value ?? "—"}</div>
    {hint && <div className="stat-hint">{hint}</div>}
  </div>;
}

export function Notice({ children, type = "error" }) {
  if (!children) return null;
  return <div className={`notice ${type}`}>{children}</div>;
}

export function Loading({ label = "Loading…" }) {
  return <div className="loading-inline">{label}</div>;
}

export function Empty({ title = "Nothing here yet", text = "Records will appear here when available." }) {
  return <div className="empty-state"><div className="empty-symbol">✦</div><strong>{title}</strong><span>{text}</span></div>;
}
