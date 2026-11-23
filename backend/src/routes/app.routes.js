import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
const r=Router();
r.use(requireAuth);
const client=allowRoles('client'), admin=allowRoles('dispensary_admin'), superAdmin=allowRoles('super_admin');
const id=v=>Number.isInteger(Number(v))&&Number(v)>0?Number(v):0;
// Support both the user's exported live schema and the optional expanded audit schema.
// actor_role / dispensary_id are stored as columns when present and always retained in details JSON.
const audit=async(conn,userId,role,dispensaryId,action,entity,entityId,details=null)=>{
  const [columns]=await conn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='audit_log'");
  const available=new Set(columns.map(column=>column.COLUMN_NAME));
  const fields=['admin_id','action_type','entity_type','entity_id','details'];
  const values=[userId,action,entity,String(entityId),JSON.stringify({actor_role:role,dispensary_id:dispensaryId,...(details||{})})];
  if(available.has('actor_role')){fields.push('actor_role');values.push(role);}
  if(available.has('dispensary_id')){fields.push('dispensary_id');values.push(dispensaryId);}
  const sql=`INSERT INTO audit_log (${fields.join(',')},created_at) VALUES (${fields.map(()=>'?').join(',')},NOW())`;
  return conn.execute(sql,values);
};
const scope=async req=>{const [u]=await pool.execute('SELECT user_id,role,managed_dispensary_id FROM app_user WHERE user_id=? AND is_active=1',[req.user.userId]);return u[0]||null;};
// Dashboard summaries
r.get('/client/dashboard',client,async(req,res)=>{const uid=req.user.userId;const [[a]]=await pool.execute("SELECT COUNT(*) appointments FROM appointment_request WHERE user_id=?",[uid]);const [[m]]=await pool.execute('SELECT COUNT(*) medicineRequests FROM medicine_request WHERE user_id=?',[uid]);const [[p]]=await pool.execute("SELECT (SELECT COUNT(*) FROM appointment_request WHERE user_id=? AND status='pending')+(SELECT COUNT(*) FROM medicine_request WHERE user_id=? AND status IN ('pending','approved')) pending",[uid,uid]);res.json({...a,...m,...p});});
r.get('/dispensary-admin/dashboard',admin,async(req,res)=>{const u=await scope(req);if(!u)return res.status(401).json({message:'Account unavailable'});const d=u.managed_dispensary_id;const [[x]]=await pool.execute("SELECT COUNT(*) inventoryItems,SUM(quantity_on_hand<=reorder_level) lowStockItems FROM dispensary_inventory WHERE dispensary_id=?",[d]);const [[m]]=await pool.execute("SELECT COUNT(*) pendingMedicineRequests FROM medicine_request WHERE dispensary_id=? AND status='pending'",[d]);const [[a]]=await pool.execute("SELECT COUNT(*) pendingAppointments FROM appointment_request WHERE dispensary_id=? AND status='pending'",[d]);res.json({...x,...m,...a});});
r.get('/super-admin/dashboard',superAdmin,async(_req,res)=>{const [[x]]=await pool.query('SELECT COUNT(*) inventoryItems,SUM(quantity_on_hand<=reorder_level) lowStockItems FROM dispensary_inventory');const [[m]]=await pool.query("SELECT COUNT(*) pendingMedicineRequests FROM medicine_request WHERE status='pending'");const [[a]]=await pool.query("SELECT COUNT(*) pendingAppointments FROM appointment_request WHERE status='pending'");const [[d]]=await pool.query('SELECT COUNT(*) dispensaries FROM dispensary');const [[u]]=await pool.query("SELECT COUNT(*) admins FROM app_user WHERE role='dispensary_admin'");res.json({...x,...m,...a,...d,...u});});
// Public-to-authenticated directory and medicine search
r.get('/directory/states',async(_req,res)=>{const [items]=await pool.query('SELECT state_id,state_name FROM state ORDER BY state_name');res.json({items});});
r.get('/directory/districts',async(req,res)=>{const stateId=id(req.query.state_id);if(!stateId)return res.json({items:[]});const [items]=await pool.execute('SELECT district_id,district_name FROM district WHERE state_id=? ORDER BY district_name',[stateId]);res.json({items});});
const directoryRows=async(query={})=>{
  const {q='',pincode='',provider_type='',city='',area=''}=query;
  const stateId=query.state_id?id(query.state_id):0;
  const districtId=query.district_id?id(query.district_id):0;
  let sql=`SELECT d.dispensary_id,d.dispensary_name,d.category,d.provider_type,d.address,d.pincode,d.telephone,
    di.district_id,di.district_name,s.state_id,s.state_name
    FROM dispensary d
    LEFT JOIN district di ON di.district_id=d.district_id
    LEFT JOIN state s ON s.state_id=di.state_id WHERE 1=1`;
  const args=[];
  if(stateId){sql+=' AND s.state_id=?';args.push(stateId);}
  if(districtId){sql+=' AND di.district_id=?';args.push(districtId);}
  for(const [v,col] of [[q,'d.dispensary_name'],[city,'di.district_name'],[area,'d.address'],[pincode,'d.pincode'],[provider_type,'d.provider_type']]){
    if(String(v||'').trim()){sql+=` AND ${col} LIKE ?`;args.push(`%${String(v).trim()}%`);}
  }
  sql+=' ORDER BY s.state_name,di.district_name,d.address,d.dispensary_name LIMIT 1000';
  const [rows]=await pool.execute(sql,args);
  return rows;
};
r.get('/directory/dispensaries',async(req,res)=>{
  try{const rows=await directoryRows(req.query);res.json({dispensaries:rows,total:rows.length});}
  catch(e){console.error('Directory search error:',e);res.status(500).json({message:'Could not search the dispensary directory.'});}
});
// Read model over normalized tables: State -> District/City -> Dispensary -> address/area.
r.get('/directory/hierarchy',async(req,res)=>{
  try{
    const rows=await directoryRows(req.query),states=new Map();
    for(const row of rows){
      const stateKey=row.state_id??'unknown-state';
      if(!states.has(stateKey))states.set(stateKey,{state_id:row.state_id,state_name:row.state_name||'State not recorded',districts:[],dispensary_count:0,_districts:new Map()});
      const state=states.get(stateKey),districtKey=row.district_id??'unknown-district';
      if(!state._districts.has(districtKey)){
        const district={district_id:row.district_id,district_name:row.district_name||'District not recorded',city_name:row.district_name||'District not recorded',dispensaries:[]};
        state._districts.set(districtKey,district);state.districts.push(district);
      }
      state._districts.get(districtKey).dispensaries.push({...row,area:row.address||''});
      state.dispensary_count++;
    }
    const result=[...states.values()].map(state=>{delete state._districts;return state;});
    res.json({states:result,total:rows.length});
  }catch(e){console.error('Directory hierarchy error:',e);res.status(500).json({message:'Could not load the location hierarchy.'});}
});
r.get('/medicines/availability',async(req,res)=>{const q=`SELECT m.medicine_id,m.medicine_name,m.generic_name,m.strength,m.dosage_form,d.dispensary_id,d.dispensary_name,COALESCE(i.quantity_on_hand,0) quantity_on_hand,CASE WHEN i.medicine_id IS NULL THEN 'Not stocked' WHEN i.quantity_on_hand=0 THEN 'Out of stock' WHEN i.quantity_on_hand<=i.reorder_level THEN 'Low stock' ELSE 'In stock' END availability_status FROM medicine m LEFT JOIN dispensary_inventory i ON i.medicine_id=m.medicine_id LEFT JOIN dispensary d ON d.dispensary_id=i.dispensary_id WHERE m.is_active=1 AND (?='' OR m.medicine_name LIKE ? OR m.generic_name LIKE ?) ORDER BY m.medicine_name,d.dispensary_name LIMIT 500`;const term=String(req.query.q||'');const [items]=await pool.execute(q,[term,`%${term}%`,`%${term}%`]);res.json({items});});
// Client request workflows
r.get('/client/appointments',client,async(req,res)=>{const [items]=await pool.execute('SELECT a.*,d.dispensary_name FROM appointment_request a JOIN dispensary d ON d.dispensary_id=a.dispensary_id WHERE a.user_id=? ORDER BY a.created_at DESC',[req.user.userId]);res.json({items});});
r.get('/client/medicine-requests',client,async(req,res)=>{const [items]=await pool.execute('SELECT m.*,d.dispensary_name FROM medicine_request m JOIN dispensary d ON d.dispensary_id=m.dispensary_id WHERE m.user_id=? ORDER BY m.created_at DESC',[req.user.userId]);res.json({items});});
r.post('/client/appointments',client,async(req,res)=>{
  const d=id(req.body.dispensaryId),s=req.body.serviceId?id(req.body.serviceId):null;
  const date=String(req.body.preferredDate||'').trim(),slot=String(req.body.timeSlot||'').toLowerCase();
  const reason=String(req.body.reason||'').trim().slice(0,500);
  if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['morning','afternoon','evening'].includes(slot))
    return res.status(400).json({message:'Choose a dispensary, a valid date and a time slot.'});
  const requestedDate=new Date(`${date}T00:00:00`),today=new Date();today.setHours(0,0,0,0);
  if(Number.isNaN(requestedDate.getTime())||requestedDate<today)return res.status(400).json({message:'Appointment date cannot be in the past.'});
  try{
    const [disp]=await pool.execute('SELECT dispensary_id FROM dispensary WHERE dispensary_id=?',[d]);
    if(!disp.length)return res.status(404).json({message:'Selected dispensary was not found.'});
    if(s){const [service]=await pool.execute('SELECT dispensary_id FROM dispensary_service WHERE dispensary_id=? AND service_id=?',[d,s]);if(!service.length)return res.status(400).json({message:'Selected service is not offered by this dispensary.'});}
    const [x]=await pool.execute("INSERT INTO appointment_request (user_id,dispensary_id,service_id,preferred_date,time_slot,reason,status) VALUES (?,?,?,?,?,?,'pending')",[req.user.userId,d,s,date,slot,reason||null]);
    res.status(201).json({appointmentId:x.insertId,message:'Appointment request submitted.'});
  }catch(e){console.error('Appointment request error:',e);res.status(500).json({message:`Appointment could not be submitted: ${e.sqlMessage||e.message}`});}
});
r.post('/client/medicine-requests',client,async(req,res)=>{const d=id(req.body.dispensaryId),items=Array.isArray(req.body.items)?req.body.items:[];if(!d||!items.length)return res.status(400).json({message:'Choose a dispensary and at least one medicine.'});const conn=await pool.getConnection();try{await conn.beginTransaction();const [disp]=await conn.execute('SELECT dispensary_id FROM dispensary WHERE dispensary_id=?',[d]);if(!disp.length)throw new Error('Selected dispensary was not found.');const [x]=await conn.execute("INSERT INTO medicine_request (user_id,dispensary_id,status,client_remarks) VALUES (?,?,'pending',?)",[req.user.userId,d,String(req.body.notes||'').slice(0,500)||null]);for(const it of items){const mid=id(it.medicineId),qty=id(it.quantity);if(!mid||!qty||qty>100)throw new Error('Each medicine needs a valid quantity (1–100).');const [available]=await conn.execute('SELECT m.medicine_id FROM medicine m JOIN dispensary_inventory i ON i.medicine_id=m.medicine_id WHERE m.medicine_id=? AND m.is_active=1 AND i.dispensary_id=?',[mid,d]);if(!available.length)throw new Error(`Medicine ID ${mid} is not stocked at the selected dispensary.`);await conn.execute('INSERT INTO medicine_request_item (request_id,medicine_id,quantity_requested) VALUES (?,?,?)',[x.insertId,mid,qty]);}await conn.commit();res.status(201).json({requestId:x.insertId,message:'Medicine request submitted.'});}catch(e){await conn.rollback();res.status(400).json({message:e.message||'Could not submit request.'});}finally{conn.release();}});
// Dispensary admin: scope is always taken from the logged-in account
r.get('/dispensary-admin/medicines',admin,async(req,res)=>{const u=await scope(req);if(!u)return res.status(401).json({message:'Account unavailable'});const [items]=await pool.execute(`SELECT m.medicine_id,m.medicine_name,m.generic_name,m.strength,m.dosage_form,COALESCE(i.quantity_on_hand,0) quantity_on_hand, i.medicine_id IS NOT NULL is_stocked FROM medicine m LEFT JOIN dispensary_inventory i ON i.medicine_id=m.medicine_id AND i.dispensary_id=? WHERE m.is_active=1 ORDER BY m.medicine_name,m.strength`,[u.managed_dispensary_id]);res.json({items});});
r.get('/dispensary-admin/inventory',admin,async(req,res)=>{const u=await scope(req);if(!u)return res.status(401).json({message:'Account unavailable'});const [items]=await pool.execute('SELECT i.*,m.medicine_name,m.strength,m.generic_name FROM dispensary_inventory i JOIN medicine m ON m.medicine_id=i.medicine_id WHERE i.dispensary_id=? ORDER BY m.medicine_name',[u.managed_dispensary_id]);res.json({items});});
r.post('/dispensary-admin/inventory/restock',admin,async(req,res)=>{const u=await scope(req),mid=id(req.body.medicine_id),qty=id(req.body.quantity),level=Number(req.body.reorder_level);if(!u)return res.status(401).json({message:'Account unavailable'});if(!mid||!qty||!Number.isInteger(level)||level<0)return res.status(400).json({message:'Enter valid medicine, quantity and reorder level.'});const c=await pool.getConnection();try{await c.beginTransaction();await c.execute('INSERT INTO dispensary_inventory (dispensary_id,medicine_id,quantity_on_hand,reorder_level) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE quantity_on_hand=quantity_on_hand+VALUES(quantity_on_hand),reorder_level=VALUES(reorder_level)',[u.managed_dispensary_id,mid,qty,level]);const [[stock]]=await c.execute('SELECT quantity_on_hand FROM dispensary_inventory WHERE dispensary_id=? AND medicine_id=?',[u.managed_dispensary_id,mid]);await c.execute("INSERT INTO stock_transactions (dispensary_id,medicine_id,txn_type,quantity_change,quantity_after,performed_by,remarks,txn_time) VALUES (?,?,'restock',?,?,?,?,NOW())",[u.managed_dispensary_id,mid,qty,stock.quantity_on_hand,u.user_id,String(req.body.remarks||'Restock').slice(0,255)]);await audit(c,u.user_id,u.role,u.managed_dispensary_id,'RESTOCK','dispensary_inventory',mid,{quantity_added:qty,quantity_after:stock.quantity_on_hand});await c.commit();res.json({message:'Stock update recorded.'});}catch(e){await c.rollback();console.error('Restock error:',e);res.status(400).json({message:'Restock failed. Confirm the medicine exists and the database schema is up to date.'});}finally{c.release();}});
r.get('/dispensary-admin/medicine-requests',admin,async(req,res)=>{const u=await scope(req);if(!u)return res.status(401).json({message:'Account unavailable'});const [items]=await pool.execute(`SELECT mr.*,au.full_name client_name,d.dispensary_name,(SELECT JSON_ARRAYAGG(JSON_OBJECT('medicine_id',m.medicine_id,'medicine_name',m.medicine_name,'strength',m.strength,'quantity_requested',mri.quantity_requested)) FROM medicine_request_item mri JOIN medicine m ON m.medicine_id=mri.medicine_id WHERE mri.request_id=mr.request_id) medicine_items FROM medicine_request mr JOIN app_user au ON au.user_id=mr.user_id JOIN dispensary d ON d.dispensary_id=mr.dispensary_id WHERE mr.dispensary_id=? ORDER BY mr.created_at DESC`,[u.managed_dispensary_id]);res.json({items});});
r.post('/dispensary-admin/medicine-requests/:id/:action',admin,async(req,res)=>{
  const u=await scope(req),rid=id(req.params.id),action=req.params.action;
  if(!u)return res.status(401).json({message:'Account unavailable.'});
  if(!u.managed_dispensary_id)return res.status(403).json({message:'This admin account is not assigned to a dispensary.'});
  if(!rid||!['approve','reject','dispense'].includes(action))return res.status(400).json({message:'Invalid request action.'});
  const c=await pool.getConnection();
  try{
    await c.beginTransaction();
    const [rr]=await c.execute('SELECT * FROM medicine_request WHERE request_id=? AND dispensary_id=? FOR UPDATE',[rid,u.managed_dispensary_id]);
    if(!rr.length)throw new Error('Request not found for your dispensary.');
    const current=rr[0].status;
    if(action==='approve'){
      if(current!=='pending')throw new Error('Only pending requests can be approved.');
      await c.execute("UPDATE medicine_request SET status='approved',processed_by=?,processed_at=NOW() WHERE request_id=? AND dispensary_id=?",[u.user_id,rid,u.managed_dispensary_id]);
      await c.execute('UPDATE medicine_request_item SET quantity_approved=quantity_requested WHERE request_id=?',[rid]);
    }else if(action==='reject'){
      if(!['pending','approved'].includes(current))throw new Error('This request cannot be rejected.');
      await c.execute("UPDATE medicine_request SET status='rejected',processed_by=?,processed_at=NOW() WHERE request_id=? AND dispensary_id=?",[u.user_id,rid,u.managed_dispensary_id]);
    }else{
      if(current!=='approved')throw new Error('Approve the request before dispensing.');
      const [lines]=await c.execute('SELECT * FROM medicine_request_item WHERE request_id=? ORDER BY medicine_id',[rid]);
      if(!lines.length)throw new Error('This request has no medicine items.');
      for(const line of lines){
        const approved=Number(line.quantity_approved??line.quantity_requested);
        const [stock]=await c.execute('SELECT quantity_on_hand FROM dispensary_inventory WHERE dispensary_id=? AND medicine_id=? FOR UPDATE',[u.managed_dispensary_id,line.medicine_id]);
        if(!stock.length||Number(stock[0].quantity_on_hand)<approved)throw new Error(`Insufficient stock for medicine ID ${line.medicine_id}.`);
        const after=Number(stock[0].quantity_on_hand)-approved;
        await c.execute('UPDATE dispensary_inventory SET quantity_on_hand=? WHERE dispensary_id=? AND medicine_id=?',[after,u.managed_dispensary_id,line.medicine_id]);
        await c.execute('UPDATE medicine_request_item SET quantity_dispensed=? WHERE request_id=? AND medicine_id=?',[approved,rid,line.medicine_id]);
        await c.execute("INSERT INTO stock_transactions (dispensary_id,medicine_id,txn_type,quantity_change,quantity_after,request_id,performed_by,remarks,txn_time) VALUES (?,?,'dispense',?,?,?,?,?,NOW())",[u.managed_dispensary_id,line.medicine_id,-approved,after,rid,u.user_id,'Medicine request dispensed']);
      }
      await c.execute("UPDATE medicine_request SET status='dispensed',processed_by=?,processed_at=NOW(),dispensed_at=NOW() WHERE request_id=? AND dispensary_id=?",[u.user_id,rid,u.managed_dispensary_id]);
    }
    await audit(c,u.user_id,u.role,u.managed_dispensary_id,`MEDICINE_REQUEST_${action.toUpperCase()}`,'medicine_request',rid,{status_before:current,status_after:action==='approve'?'approved':action==='reject'?'rejected':'dispensed'});
    await c.commit();
    res.json({message:`Medicine request ${action==='approve'?'approved':action==='reject'?'rejected':'dispensed'} successfully.`});
  }catch(e){await c.rollback();console.error('Medicine request action error:',e);res.status(400).json({message:e.sqlMessage||e.message||'Could not process medicine request.'});}
  finally{c.release();}
});
r.get('/dispensary-admin/appointments',admin,async(req,res)=>{const u=await scope(req);const [items]=await pool.execute('SELECT a.*,au.full_name client_name,d.dispensary_name FROM appointment_request a JOIN app_user au ON au.user_id=a.user_id JOIN dispensary d ON d.dispensary_id=a.dispensary_id WHERE a.dispensary_id=? ORDER BY a.created_at DESC',[u.managed_dispensary_id]);res.json({items});});
r.post('/dispensary-admin/appointments/:id/:action',admin,async(req,res)=>{
  const u=await scope(req),aid=id(req.params.id),action=req.params.action;
  const status=action==='confirm'?'confirmed':action==='reject'?'rejected':null;
  if(!u)return res.status(401).json({message:'Account unavailable.'});
  if(!u.managed_dispensary_id)return res.status(403).json({message:'This admin account is not assigned to a dispensary.'});
  if(!aid||!status)return res.status(400).json({message:'Invalid appointment action.'});
  const c=await pool.getConnection();
  try{
    await c.beginTransaction();
    const [rows]=await c.execute("SELECT appointment_id,status FROM appointment_request WHERE appointment_id=? AND dispensary_id=? FOR UPDATE",[aid,u.managed_dispensary_id]);
    if(!rows.length)throw new Error('Appointment not found for your dispensary.');
    if(rows[0].status!=='pending')throw new Error('Only pending appointments can be processed.');
    await c.execute("UPDATE appointment_request SET status=?,processed_by=?,processed_at=NOW(),admin_remarks=? WHERE appointment_id=? AND dispensary_id=?",[status,u.user_id,String(req.body?.remarks||'').slice(0,500)||null,aid,u.managed_dispensary_id]);
    await audit(c,u.user_id,u.role,u.managed_dispensary_id,`APPOINTMENT_${status.toUpperCase()}`,'appointment_request',aid,{status_before:'pending',status_after:status});
    await c.commit();res.json({message:`Appointment ${status}.`});
  }catch(e){await c.rollback();console.error('Appointment action error:',e);res.status(400).json({message:e.sqlMessage||e.message||'Could not process appointment.'});}
  finally{c.release();}
});
// Super Admin management
r.get('/super-admin/dispensaries',superAdmin,async(_req,res)=>{const [items]=await pool.query('SELECT dispensary_id,dispensary_name,district_id FROM dispensary ORDER BY dispensary_name');res.json({items});});
r.get('/super-admin/admins',superAdmin,async(_req,res)=>{const [items]=await pool.query("SELECT u.user_id,u.full_name,u.email,u.phone,u.is_active,u.managed_dispensary_id,d.dispensary_name FROM app_user u LEFT JOIN dispensary d ON d.dispensary_id=u.managed_dispensary_id WHERE u.role='dispensary_admin' ORDER BY u.user_id DESC");res.json({items});});
r.post('/super-admin/admins',superAdmin,async(req,res)=>{const {fullName,email,password,phone,dispensaryId}=req.body||{},d=id(dispensaryId);if(!fullName||!email||!/^\S+@\S+\.\S+$/.test(email)||!password||password.length<8||!d)return res.status(400).json({message:'Enter name, valid email, password (8+ characters) and dispensary.'});try{const hash=await bcrypt.hash(password,12);const [x]=await pool.execute("INSERT INTO app_user (full_name,email,password_hash,phone,role,managed_dispensary_id) VALUES (?,?,?,?,'dispensary_admin',?)",[fullName.trim(),email.trim().toLowerCase(),hash,phone||null,d]);res.status(201).json({userId:x.insertId,message:'Dispensary admin created.'});}catch(e){res.status(400).json({message:e.code==='ER_DUP_ENTRY'?'Email already exists.':'Could not create admin. Verify dispensary.'});}});
r.post('/super-admin/medicines',superAdmin,async(req,res)=>{const {medicineName,genericName,strength,dosageForm}=req.body||{};if(!medicineName?.trim())return res.status(400).json({message:'Medicine name is required.'});try{const [x]=await pool.execute('INSERT INTO medicine (medicine_name,generic_name,strength,dosage_form,is_active) VALUES (?,?,?,?,1)',[medicineName.trim(),genericName||null,strength||null,dosageForm||null]);res.status(201).json({medicineId:x.insertId,message:'Medicine added to catalogue.'});}catch(e){res.status(400).json({message:'Could not add medicine. Check catalogue constraints.'});}});
r.get('/super-admin/medicines',superAdmin,async(_req,res)=>{const [items]=await pool.query('SELECT medicine_id,medicine_name,generic_name,strength,dosage_form,is_active FROM medicine ORDER BY medicine_name');res.json({items});});
export default r;
