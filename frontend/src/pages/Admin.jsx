import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, CalendarDays, ClipboardCheck, Package, ShieldCheck } from "lucide-react";
import { get, post } from "../api";
import { PageHeader, StatCard, Notice, Loading, Empty } from "../components/UI";
import { useAuth } from "../context";

export function AdminHome() {
  const { user } = useAuth(); const [data,setData]=useState(null); const [error,setError]=useState("");
  useEffect(()=>{get(user?.role === "super_admin" ? "/super-admin/dashboard" : "/dispensary-admin/dashboard").then(setData).catch(e=>setError(e.message));},[user?.role]);
  const superAdmin = user?.role === "super_admin";
  return <>
    <PageHeader eyebrow={superAdmin?"PLATFORM CONTROL":"DISPENSARY WORKSPACE"} title={superAdmin?"Platform overview":"Dispensary overview"} description={superAdmin?"Review platform-wide activity and manage the dispensary network.":"Manage your assigned dispensary's inventory, appointments and medicine requests."}/>
    <Notice>{error}</Notice>
    {superAdmin && <div className="notice info"><ShieldCheck size={17}/> Super Admin view. Operational data is read-only by default; use audited override actions only where enabled by the backend.</div>}
    <div className="stats-grid">
      <StatCard label="Inventory items" value={data?.inventoryItems ?? "—"} hint="Medicine-stock combinations" icon={Package}/>
      <StatCard label="Pending medicine requests" value={data?.pendingMedicineRequests ?? "—"} hint="Awaiting processing" icon={ClipboardCheck}/>
      <StatCard label="Pending appointments" value={data?.pendingAppointments ?? "—"} hint="Awaiting confirmation" icon={CalendarDays}/>
      <StatCard label="Low-stock items" value={data?.lowStockItems ?? "—"} hint="At or below reorder level" icon={AlertTriangle}/>
    </div>
    <div className="section-heading"><div><div className="eyebrow">OPERATIONS</div><h2>Workspace at a glance</h2></div></div>
    <div className="action-grid">
      <div className="action-card static"><div className="action-icon green"><Package/></div><h3>Inventory control</h3><p>Update quantities, record restocks and review low-stock medicines.</p></div>
      <div className="action-card static"><div className="action-icon purple"><ClipboardCheck/></div><h3>Request processing</h3><p>Review client requests and approve, reject or dispense medicines.</p></div>
      <div className="action-card static"><div className="action-icon blue"><Activity/></div><h3>Accountability</h3><p>Stock transactions and administrative actions are recorded for review.</p></div>
    </div>
  </>;
}

export function Inventory() {
  const [items,setItems]=useState([]); const [medicines,setMedicines]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [message,setMessage]=useState("");
  const [form,setForm]=useState({medicine_id:"",quantity:10,reorder_level:10,remarks:"Initial stock"});
  async function load(){setLoading(true);try{const r=await get("/dispensary-admin/inventory");setItems(r.items||r);}catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{load();get("/dispensary-admin/medicines").then(r=>setMedicines(r.items||[])).catch(e=>setError(e.message));},[]);
  async function addStock(e){e.preventDefault();setError("");setMessage("");try{await post("/dispensary-admin/inventory/restock",{medicine_id:Number(form.medicine_id),quantity:Number(form.quantity),reorder_level:Number(form.reorder_level),remarks:form.remarks});setMessage("Stock update recorded.");setForm({...form,medicine_id:""});await load();}catch(e){setError(e.message);}}
  return <>
    <PageHeader eyebrow="STOCK CONTROL" title="Inventory" description="Manage stock for your assigned dispensary. Every quantity change should create a stock transaction."/>
    <Notice>{error}</Notice><Notice type="success">{message}</Notice>
    <div className="content-panel"><h3>Record a restock</h3><p className="muted">The backend must validate the medicine and write both inventory and ledger changes in a transaction.</p>
      <form className="inline-form" onSubmit={addStock}>
        <select className="plain-input" value={form.medicine_id} onChange={e=>setForm({...form,medicine_id:e.target.value})} required>
          <option value="">Select medicine (ID — name)</option>
          {medicines.map(m=><option key={m.medicine_id} value={m.medicine_id}>ID {m.medicine_id} — {m.medicine_name}{m.strength?` (${m.strength})`:""}{m.is_stocked?` · Current stock: ${m.quantity_on_hand}`:" · Not stocked yet"}</option>)}
        </select>
        <input className="plain-input" type="number" min="1" placeholder="Quantity to add" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} required/>
        <input className="plain-input" type="number" min="0" placeholder="Reorder level" value={form.reorder_level} onChange={e=>setForm({...form,reorder_level:e.target.value})} required/>
        <input className="plain-input" placeholder="Reason / reference" value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/>
        <button className="primary-button">Save restock</button>
      </form>
    </div>
    <div className="section-heading"><div><div className="eyebrow">CURRENT STOCK</div><h2>Medicine inventory</h2></div><button className="secondary-button" onClick={load}>Refresh</button></div>
    {loading?<Loading/>:items.length===0?<Empty title="Inventory is empty" text="Add a medicine to this dispensary before recording stock."/>:
      <div className="table-wrap"><table><thead><tr><th>Medicine ID</th><th>Medicine</th><th>Strength</th><th>Quantity</th><th>Reorder level</th><th>Stock status</th></tr></thead><tbody>{items.map((x,i)=><tr key={x.medicine_id||i}><td><strong>#{x.medicine_id}</strong></td><td><strong>{x.medicine_name}</strong></td><td>{x.strength||"—"}</td><td>{x.quantity_on_hand}</td><td>{x.reorder_level}</td><td><span className={`status ${x.quantity_on_hand<=x.reorder_level?"low-stock":"in-stock"}`}>{x.quantity_on_hand<=x.reorder_level?"Low stock":"In stock"}</span></td></tr>)}</tbody></table></div>}
  </>;
}

function parseMedicineItems(value) { try { return value ? JSON.parse(value) : []; } catch { return []; } }

export function MedicineRequests() {
  const [items,setItems]=useState([]);const [error,setError]=useState("");const [busy,setBusy]=useState("");
  async function load(){try{const r=await get("/dispensary-admin/medicine-requests");setItems(r.items||r);}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  async function process(id,action){setBusy(String(id));setError("");try{await post(`/dispensary-admin/medicine-requests/${id}/${action}`,{});await load();}catch(e){setError(e.message);}finally{setBusy("");}}
  return <>
    <PageHeader eyebrow="CLIENT REQUESTS" title="Medicine requests" description="Review requests from clients for this dispensary. Stock is deducted only when a request is dispensed."/>
    <Notice>{error}</Notice>
    {!items.length?<Empty title="No medicine requests" text="New client requests will appear here."/>:
      <div className="table-wrap"><table><thead><tr><th>Request</th><th>Client</th><th>Requested medicines</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((x,i)=><tr key={x.request_id||i}><td>#{x.request_id}</td><td>{x.client_name||x.user_name||"Client"}</td><td>{(Array.isArray(x.medicine_items)?x.medicine_items:parseMedicineItems(x.medicine_items)).map(m=><div key={m.medicine_id}><strong>#{m.medicine_id} · {m.medicine_name}</strong><small>{m.strength||"No strength"} · Qty: {m.quantity_requested}</small></div>)}</td><td>{String(x.created_at||"").slice(0,10)||"—"}</td><td><span className={`status ${x.status}`}>{x.status}</span></td><td className="actions-cell">{x.status==="pending"&&<><button className="small-button approve" disabled={busy===String(x.request_id)} onClick={()=>process(x.request_id,"approve")}>Approve</button><button className="small-button reject" disabled={busy===String(x.request_id)} onClick={()=>process(x.request_id,"reject")}>Reject</button></>}{x.status==="approved"&&<button className="small-button approve" disabled={busy===String(x.request_id)} onClick={()=>process(x.request_id,"dispense")}>Dispense</button>}</td></tr>)}</tbody></table></div>}
  </>;
}

export function Appointments() {
  const [items,setItems]=useState([]);const [error,setError]=useState("");
  async function load(){try{const r=await get("/dispensary-admin/appointments");setItems(r.items||r);}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  async function update(id,action){try{await post(`/dispensary-admin/appointments/${id}/${action}`,{});await load();}catch(e){setError(e.message);}}
  return <>
    <PageHeader eyebrow="SERVICE BOOKINGS" title="Appointments" description="Confirm or reject appointment requests for your assigned dispensary."/>
    <Notice>{error}</Notice>
    {!items.length?<Empty title="No appointments" text="Client appointment requests will appear here."/>:
      <div className="table-wrap"><table><thead><tr><th>Appointment</th><th>Client</th><th>Preferred date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((x,i)=><tr key={x.appointment_id||i}><td>#{x.appointment_id}</td><td>{x.client_name||"Client"}</td><td>{String(x.preferred_date||"").slice(0,10)}</td><td><span className={`status ${x.status}`}>{x.status}</span></td><td className="actions-cell">{x.status==="pending"&&<><button className="small-button approve" onClick={()=>update(x.appointment_id,"confirm")}>Confirm</button><button className="small-button reject" onClick={()=>update(x.appointment_id,"reject")}>Reject</button></>}</td></tr>)}</tbody></table></div>}
  </>;
}
