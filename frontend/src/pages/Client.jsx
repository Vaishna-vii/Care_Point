import React, { useEffect, useState } from "react";
import { Activity, CalendarDays, ClipboardList, MapPin, Package, Search, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import { PageHeader, StatCard, Loading, Empty, Notice } from "../components/UI";
import { useAuth } from "../context";

export function ClientHome() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null); const [error, setError] = useState("");
  useEffect(() => { get("/client/dashboard").then(setSummary).catch(e=>setError(e.message)); }, []);
  return <>
    <PageHeader eyebrow="CLIENT PORTAL" title={`Hello, ${(user?.full_name || "there").split(" ")[0]}.`} description="Find nearby care, explore medicine availability and keep track of your requests." action={<Link className="primary-button" to="/client/directory"><Search size={16}/> Find a dispensary</Link>}/>
    <Notice>{error}</Notice>
    <div className="stats-grid">
      <StatCard label="My appointments" value={summary?.appointments ?? "—"} hint="All appointment requests" icon={CalendarDays}/>
      <StatCard label="Medicine requests" value={summary?.medicineRequests ?? "—"} hint="Requests submitted" icon={Package}/>
      <StatCard label="Pending requests" value={summary?.pending ?? "—"} hint="Awaiting an update" icon={ClipboardList}/>
    </div>
    <div className="section-heading"><div><div className="eyebrow">QUICK ACCESS</div><h2>What would you like to do?</h2></div></div>
    <div className="action-grid">
      <Link to="/client/directory" className="action-card"><div className="action-icon blue"><MapPin/></div><h3>Find a dispensary</h3><p>Search by state, district, PIN code or provider type.</p><span>Explore directory <ArrowUpRight size={15}/></span></Link>
      <Link to="/client/medicines" className="action-card"><div className="action-icon green"><Package/></div><h3>Check medicines</h3><p>Search the medicine catalogue and view availability status.</p><span>Search medicines <ArrowUpRight size={15}/></span></Link>
      <Link to="/client/requests" className="action-card"><div className="action-icon purple"><ClipboardList/></div><h3>Track requests</h3><p>Review your appointments and medicine requests.</p><span>View my requests <ArrowUpRight size={15}/></span></Link>
    </div>
  </>;
}

export function Directory() {
  const [filters, setFilters] = useState({ q:"", state_id:"", district_id:"", city:"", area:"", pincode:"", provider_type:"" });
  const [states,setStates] = useState([]);
  const [districts,setDistricts] = useState([]);
  const [groups,setGroups] = useState([]);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [locationsError,setLocationsError] = useState("");
  const [selected,setSelected] = useState(null);
  const [appointment,setAppointment] = useState({preferredDate:"",timeSlot:"morning",reason:""});
  const [booking,setBooking] = useState(false);
  const [notice,setNotice] = useState("");

  useEffect(() => {
    get("/directory/states").then(r => setStates(r.items || []))
      .catch(e => setLocationsError(`Could not load states: ${e.message}`));
  }, []);

  useEffect(() => {
    if (!filters.state_id) { setDistricts([]); return; }
    get(`/directory/districts?state_id=${encodeURIComponent(filters.state_id)}`)
      .then(r => setDistricts(r.items || []))
      .catch(e => { setDistricts([]); setLocationsError(`Could not load districts: ${e.message}`); });
  }, [filters.state_id]);

  async function search(e) {
    e?.preventDefault(); setLoading(true); setError(""); setNotice("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key,value]) => { if (String(value).trim()) params.set(key,value); });
      const result = await get(`/directory/hierarchy?${params.toString()}`);
      setGroups(result.states || []); setTotal(result.total || 0);
    } catch(err) { setError(err.message); setGroups([]); setTotal(0); }
    finally { setLoading(false); }
  }

  useEffect(() => { search(); }, []);

  async function submitAppointment(e) {
    e.preventDefault(); if (!selected) return;
    setBooking(true); setError(""); setNotice("");
    try {
      const result = await post("/client/appointments", {
        dispensaryId:selected.dispensary_id,
        preferredDate:appointment.preferredDate,
        timeSlot:appointment.timeSlot,
        reason:appointment.reason
      });
      setNotice(`${result.message || "Appointment request submitted."} Reference #${result.appointmentId}.`);
      setSelected(null); setAppointment({preferredDate:"",timeSlot:"morning",reason:""});
    } catch(e) { setError(e.message); }
    finally { setBooking(false); }
  }

  const today = new Date().toLocaleDateString("en-CA");
  return <>
    <PageHeader eyebrow="DISPENSARY NETWORK" title="Find healthcare by location" description="Browse the directory in State → District/City → Dispensary → Area order, or search directly by name, locality or PIN code."/>
    <form className="filter-panel" onSubmit={search}>
      <div className="filter-grid directory-filter-grid">
        <input className="plain-input" placeholder="Dispensary / hospital name" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
        <select className="plain-input" value={filters.state_id} onChange={e=>setFilters({...filters,state_id:e.target.value,district_id:""})}>
          <option value="">All states</option>
          {states.map(state=><option key={state.state_id} value={state.state_id}>{state.state_name}</option>)}
        </select>
        <select className="plain-input" value={filters.district_id} onChange={e=>setFilters({...filters,district_id:e.target.value})} disabled={!filters.state_id}>
          <option value="">{filters.state_id ? "All districts / cities" : "Select a state first"}</option>
          {districts.map(district=><option key={district.district_id} value={district.district_id}>{district.district_name}</option>)}
        </select>
        <input className="plain-input" placeholder="City / district name" value={filters.city} onChange={e=>setFilters({...filters,city:e.target.value})}/>
        <input className="plain-input" placeholder="Area / locality / address" value={filters.area} onChange={e=>setFilters({...filters,area:e.target.value})}/>
        <input className="plain-input" placeholder="PIN code" value={filters.pincode} onChange={e=>setFilters({...filters,pincode:e.target.value})}/>
        <input className="plain-input" placeholder="Provider type" value={filters.provider_type} onChange={e=>setFilters({...filters,provider_type:e.target.value})}/>
        <button className="primary-button" disabled={loading}><Search size={16}/>{loading?"Searching…":"Search directory"}</button>
      </div>
      <div className="directory-filter-actions"><button type="button" className="secondary-button" onClick={()=>{setFilters({q:"",state_id:"",district_id:"",city:"",area:"",pincode:"",provider_type:""});setSelected(null);}}>Clear filters</button><span>Search fields can be combined.</span></div>
    </form>
    <Notice>{locationsError}</Notice><Notice>{error}</Notice><Notice type="success">{notice}</Notice>
    {selected && <section className="content-panel appointment-panel">
      <div className="section-heading"><div><div className="eyebrow">BOOK A VISIT</div><h2>Request appointment</h2><p className="muted">{selected.dispensary_name} · {selected.district_name}, {selected.state_name}</p></div>
        <button type="button" className="secondary-button" onClick={()=>setSelected(null)}>Cancel</button></div>
      <form className="inline-form" onSubmit={submitAppointment}>
        <label>Preferred date<input className="plain-input" type="date" min={today} value={appointment.preferredDate} onChange={e=>setAppointment({...appointment,preferredDate:e.target.value})} required/></label>
        <label>Time slot<select className="plain-input" value={appointment.timeSlot} onChange={e=>setAppointment({...appointment,timeSlot:e.target.value})}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
        <label className="appointment-reason">Reason (optional)<input className="plain-input" maxLength="500" placeholder="Brief reason for visit" value={appointment.reason} onChange={e=>setAppointment({...appointment,reason:e.target.value})}/></label>
        <button className="primary-button" disabled={booking}>{booking?"Submitting…":"Submit appointment request"}</button>
      </form>
    </section>}
    <div className="results-heading"><strong>{total} dispensaries found</strong><span>Grouped by state, district/city and address area</span></div>
    {loading?<Loading/>:groups.length===0?<Empty title="No dispensaries found" text="Try a different state, district, dispensary name, area or PIN code."/>:
      <div className="hierarchy-list">{groups.map((state,index)=><details className="hierarchy-state" key={state.state_id ?? state.state_name} open={index===0 || Boolean(filters.state_id)}>
        <summary><span><strong>{state.state_name}</strong><small>{state.districts.length} districts/cities</small></span><span className="hierarchy-count">{state.dispensary_count} dispensaries</span></summary>
        <div className="hierarchy-districts">{state.districts.map(district=><details className="hierarchy-district" key={district.district_id ?? district.district_name} open={Boolean(filters.district_id) || Boolean(filters.city)}>
          <summary><span><strong>{district.city_name}</strong><small>District / city</small></span><span className="hierarchy-count">{district.dispensaries.length} facilities</span></summary>
          <div className="table-wrap"><table><thead><tr><th>Dispensary / hospital</th><th>Area / address</th><th>PIN</th><th>Provider type</th><th>Contact</th><th>Action</th></tr></thead><tbody>
            {district.dispensaries.map(d=><tr key={d.dispensary_id}><td><strong>{d.dispensary_name}</strong><small>ID #{d.dispensary_id}</small></td><td>{d.area || "Address not available"}</td><td>{d.pincode && d.pincode!=="NA"?d.pincode:"—"}</td><td>{d.provider_type || d.category || "—"}</td><td>{d.telephone && d.telephone!=="NA"?d.telephone:"—"}</td><td><button type="button" className="small-button approve" onClick={()=>{setSelected(d);setAppointment({preferredDate:"",timeSlot:"morning",reason:""});window.scrollTo({top:0,behavior:"smooth"});}}>Request appointment</button></td></tr>)}
          </tbody></table></div>
        </details>)}</div>
      </details>)}</div>}
  </>;
}

export function Medicines() {
  const [q,setQ] = useState(""); const [items,setItems] = useState([]); const [error,setError] = useState(""); const [loading,setLoading] = useState(false);
  async function search(e){e?.preventDefault();setLoading(true);setError("");try{const p=new URLSearchParams();if(q)p.set("q",q);const r=await get(`/medicines/availability?${p}`);setItems(r.items||r.medicines||r);}catch(err){setError(err.message);}finally{setLoading(false);}}
  useEffect(()=>{search();},[]);
  return <>
    <PageHeader eyebrow="MEDICINE CATALOGUE" title="Medicine availability" description="Search the catalogue and check availability status across dispensaries."/>
    <form className="search-bar" onSubmit={search}><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search medicine name or generic name…"/><button className="primary-button" disabled={loading}>{loading?"Searching":"Search"}</button></form>
    <Notice>{error}</Notice>
    {loading?<Loading/>:items.length===0?<Empty title="No medicines found" text="Medicine catalogue entries will appear here once added by the Super Admin."/>:
      <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Strength</th><th>Dosage form</th><th>Dispensary</th><th>Availability</th></tr></thead><tbody>
      {items.map((m,i)=><tr key={`${m.medicine_id}-${m.dispensary_id}-${i}`}><td><strong>{m.medicine_name}</strong>{m.generic_name&&<small>{m.generic_name}</small>}</td><td>{m.strength||"—"}</td><td>{m.dosage_form||"—"}</td><td>{m.dispensary_name||"—"}</td><td><span className={`status ${String(m.availability_status||"not stocked").toLowerCase().replaceAll(" ","-")}`}>{m.availability_status||"Not stocked"}</span>{m.dispensary_id&&<button className="small-button approve" onClick={async()=>{const quantity=Number(window.prompt("Quantity requested:","1"));if(!quantity||quantity<1)return;try{await post("/client/medicine-requests",{dispensaryId:m.dispensary_id,items:[{medicineId:m.medicine_id,quantity}]});window.alert("Medicine request submitted.");}catch(e){window.alert(e.message)}}}>Request</button>}</td></tr>)}
      </tbody></table></div>}
  </>;
}

export function MyRequests() {
  const [appointments,setAppointments]=useState([]); const [requests,setRequests]=useState([]); const [error,setError]=useState("");
  useEffect(()=>{Promise.all([get("/client/appointments"),get("/client/medicine-requests")]).then(([a,m])=>{setAppointments(a.items||a);setRequests(m.items||m);}).catch(e=>setError(e.message));},[]);
  return <>
    <PageHeader eyebrow="MY ACTIVITY" title="My requests" description="Keep track of appointment and medicine request updates."/>
    <Notice>{error}</Notice>
    <div className="section-heading"><div><div className="eyebrow">HEALTHCARE SERVICES</div><h2>Appointments</h2></div></div>
    <RecordsTable items={appointments} type="appointment"/>
    <div className="section-heading spaced"><div><div className="eyebrow">MEDICINE</div><h2>Medicine requests</h2></div></div>
    <RecordsTable items={requests} type="medicine"/>
  </>;
}

function RecordsTable({items,type}) {
  if(!items.length) return <Empty title={`No ${type} requests yet`}/>;
  return <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Dispensary</th><th>Date</th><th>Status</th></tr></thead><tbody>{items.map((x,i)=><tr key={x.appointment_id||x.request_id||i}><td>#{x.appointment_id||x.request_id}</td><td>{x.dispensary_name||`Dispensary ${x.dispensary_id}`}</td><td>{(x.preferred_date||x.created_at||"").toString().slice(0,10)||"—"}</td><td><span className={`status ${String(x.status).toLowerCase()}`}>{x.status}</span></td></tr>)}</tbody></table></div>;
}
