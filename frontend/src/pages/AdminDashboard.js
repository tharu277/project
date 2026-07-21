import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const [tab, setTab]     = useState('buses');
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busForm, setBusForm]     = useState({ busNumber:'', status:'inactive' });
  const [routeForm, setRouteForm] = useState({ routeNumber:'', origin:'', destination:'', totalDistance:'', estimatedTime:'' });
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/api/buses`).then(r => setBuses(r.data)).catch(()=>{});
    axios.get(`${API}/api/routes`).then(r => setRoutes(r.data)).catch(()=>{});
  }, []);

  const addBus = async e => {
    e.preventDefault();
    const { data } = await axios.post(`${API}/api/buses`, busForm, { headers });
    setBuses([...buses, data]);
    setBusForm({ busNumber:'', status:'inactive' });
  };
  const deleteBus = async id => {
    await axios.delete(`${API}/api/buses/${id}`, { headers });
    setBuses(buses.filter(b => b._id !== id));
  };
  const addRoute = async e => {
    e.preventDefault();
    const { data } = await axios.post(`${API}/api/routes`, routeForm, { headers });
    setRoutes([...routes, data]);
    setRouteForm({ routeNumber:'', origin:'', destination:'', totalDistance:'', estimatedTime:'' });
  };
  const deleteRoute = async id => {
    await axios.delete(`${API}/api/routes/${id}`, { headers });
    setRoutes(routes.filter(r => r._id !== id));
  };

  return (
    <div style={S.page}>

      <div style={S.explainBar}>
        <span style={S.explainIcon}>ℹ️</span>
        <div style={S.explainText}>
          <strong>ADMIN DASHBOARD</strong> 
        </div>
      </div>

      <div style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navLogoIcon}>🛡</div>
          <div>
            <div style={S.navBrand}>Admin Dashboard</div>
            <div style={S.navTag}>Admin: {user?.name}</div>
          </div>
        </div>
        <div style={S.navRight}>
          <Link to="/" style={S.navBtn}>🗺 View Live Map</Link>
          <button onClick={logout} style={S.navBtn}>⏻ Logout</button>
        </div>
      </div>

      <div style={S.statsRow}>
        <div style={S.statCard}><div style={S.statNum}>{buses.length}</div><div style={S.statLabel}>Total Buses</div></div>
        <div style={{...S.statCard, borderColor:'#22c55e'}}><div style={S.statNum}>{buses.filter(b=>b.status==='on-trip').length}</div><div style={S.statLabel}>On Trip</div></div>
        <div style={{...S.statCard, borderColor:'#3b82f6'}}><div style={S.statNum}>{routes.length}</div><div style={S.statLabel}>Routes</div></div>
      </div>

      <div style={S.tabs}>
        <button style={tab==='buses' ? S.tabAct : S.tab} onClick={()=>setTab('buses')}>🚌 Manage Buses</button>
        <button style={tab==='routes' ? S.tabAct : S.tab} onClick={()=>setTab('routes')}>🗺 Manage Routes</button>
      </div>

      <div style={S.content}>

        {tab==='buses' && (
          <>
            <div style={S.formCard}>
              <div style={S.formTitle}>➕ Add New Bus</div>
              <form onSubmit={addBus} style={S.formRow}>
                <input style={S.input} placeholder="Bus Number (e.g. NB-1234)" value={busForm.busNumber}
                  onChange={e=>setBusForm({...busForm, busNumber:e.target.value})} required />
                <select style={S.input} value={busForm.status} onChange={e=>setBusForm({...busForm, status:e.target.value})}>
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
                <button style={S.addBtn} type="submit">+ Add Bus</button>
              </form>
            </div>

            <div style={S.tableCard}>
              <div style={S.tableHeader}>📋 All Buses List ({buses.length})</div>
              {buses.map(b => (
                <div key={b._id} style={S.tableRow}>
                  <span style={S.rowMain}>{b.busNumber}</span>
                  <span style={b.status==='on-trip' ? S.pillGreen : S.pillGray}>{b.status}</span>
                  <button style={S.delBtn} onClick={()=>deleteBus(b._id)}>🗑 Delete</button>
                </div>
              ))}
              {buses.length===0 && <div style={S.empty}>No Available buses — Add Buses form</div>}
            </div>
          </>
        )}

        {tab==='routes' && (
          <>
            <div style={S.formCard}>
              <div style={S.formTitle}>➕ Add New Route</div>
              <form onSubmit={addRoute} style={S.formRow}>
                <input style={S.input} placeholder="Route No. (138)" value={routeForm.routeNumber}
                  onChange={e=>setRouteForm({...routeForm, routeNumber:e.target.value})} required />
                <input style={S.input} placeholder="Origin (Pannipitiya)" value={routeForm.origin}
                  onChange={e=>setRouteForm({...routeForm, origin:e.target.value})} required />
                <input style={S.input} placeholder="Destination (Fort)" value={routeForm.destination}
                  onChange={e=>setRouteForm({...routeForm, destination:e.target.value})} required />
                <button style={S.addBtn} type="submit">+ Add Route</button>
              </form>
            </div>

            <div style={S.tableCard}>
              <div style={S.tableHeader}>📋 All Routes List ({routes.length})</div>
              {routes.map(r => (
                <div key={r._id} style={S.tableRow}>
                  <span style={S.rowMain}>Route {r.routeNumber}: {r.origin} → {r.destination}</span>
                  <button style={S.delBtn} onClick={()=>deleteRoute(r._id)}>🗑 Delete</button>
                </div>
              ))}
              {routes.length===0 && <div style={S.empty}>No Available Routes — Add routes</div>}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const S = {
  page: { minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Segoe UI',sans-serif" },
  explainBar: { display:'flex', gap:'10px', alignItems:'flex-start', background:'#fffbeb', borderBottom:'2px dashed #f59e0b', padding:'12px 24px', fontSize:'12px', color:'#78350f' },
  explainIcon: { fontSize:'16px' },
  explainText: { lineHeight:1.5 },
  nav: { background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  navLogo: { display:'flex', alignItems:'center', gap:'10px' },
  navLogoIcon: { width:'40px', height:'40px', background:'#dbeafe', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' },
  navBrand: { fontSize:'15px', fontWeight:'700', color:'#0f172a' },
  navTag: { fontSize:'11px', color:'#94a3b8' },
  navRight: { display:'flex', gap:'8px' },
  navBtn: { padding:'7px 14px', background:'#f8fafc', color:'#334155', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', textDecoration:'none' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', padding:'20px 24px 0' },
  statCard: { background:'#fff', borderRadius:'12px', padding:'14px', textAlign:'center', border:'1px solid #e2e8f0', borderLeft:'4px solid #1d4ed8' },
  statNum: { fontSize:'24px', fontWeight:'700', color:'#0f172a' },
  statLabel: { fontSize:'11px', color:'#94a3b8' },
  tabs: { display:'flex', gap:'8px', padding:'16px 24px 0' },
  tab: { padding:'9px 16px', border:'1px solid #e2e8f0', background:'#fff', borderRadius:'8px', fontSize:'12px', color:'#64748b', cursor:'pointer', fontWeight:'600' },
  tabAct: { padding:'9px 16px', border:'1px solid #1d4ed8', background:'#1d4ed8', borderRadius:'8px', fontSize:'12px', color:'#fff', cursor:'pointer', fontWeight:'600' },
  content: { padding:'20px 24px' },
  formCard: { background:'#fff', borderRadius:'12px', padding:'16px 18px', border:'1px solid #e2e8f0', marginBottom:'16px' },
  formTitle: { fontSize:'13px', fontWeight:'700', color:'#0f172a', marginBottom:'12px' },
  formRow: { display:'flex', gap:'8px', flexWrap:'wrap' },
  input: { padding:'9px 12px', borderRadius:'8px', border:'1.5px solid #e2e8f0', fontSize:'12px', flex:1, minWidth:'140px' },
  addBtn: { padding:'9px 16px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' },
  tableCard: { background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden' },
  tableHeader: { padding:'12px 16px', background:'#f8fafc', fontSize:'12px', fontWeight:'700', color:'#0f172a', borderBottom:'1px solid #e2e8f0' },
  tableRow: { display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', borderBottom:'1px solid #f1f5f9' },
  rowMain: { flex:1, fontSize:'13px', fontWeight:'600', color:'#0f172a' },
  pillGreen: { fontSize:'11px', background:'#dcfce7', color:'#166534', padding:'3px 8px', borderRadius:'99px' },
  pillGray: { fontSize:'11px', background:'#f1f5f9', color:'#64748b', padding:'3px 8px', borderRadius:'99px' },
  delBtn: { padding:'5px 10px', background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca', borderRadius:'6px', fontSize:'11px', cursor:'pointer' },
  empty: { padding:'20px', textAlign:'center', color:'#94a3b8', fontSize:'12px' },
};
