import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function DriverDashboard() {
  const { user, token, logout } = useAuth();
  const [buses, setBuses]     = useState([]);
  const [busId, setBusId]     = useState('');
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords]   = useState(null);
  const [speed, setSpeed]     = useState(0);
  const watchRef = useRef(null);

  useEffect(() => { axios.get(`${API}/api/buses`).then(r => setBuses(r.data)).catch(()=>{}); }, []);

  const startTrip = () => {
    if (!busId) { alert('Select the Bus! (Step 1 )'); return; }
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude:lat, longitude:lng, speed:spd } = pos.coords;
        const kmh = spd ? Math.round(spd*3.6) : 0;
        setCoords({ lat, lng }); setSpeed(kmh);
        axios.post(`${API}/api/location/update`, { busId, lat, lng, speed:kmh },
          { headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{});
      },
      ()=>{}, { enableHighAccuracy:true, maximumAge:3000, timeout:10000 }
    );
  };

  const endTrip = async () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    await axios.put(`${API}/api/buses/${busId}`, { status:'inactive' }, { headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{});
    setTracking(false); setCoords(null); setSpeed(0);
  };

  return (
    <div style={S.page}>

      <div style={S.explainBar}>
        <span style={S.explainIcon}>ℹ️</span>
        <div style={S.explainText}>
          <strong>DRIVER DASHBOARD</strong> 
        </div>
      </div>

      <div style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navLogoIcon}>🚗</div>
          <div>
            <div style={S.navBrand}>Driver Dashboard</div>
            <div style={S.navTag}>Driver: {user?.name}</div>
          </div>
        </div>
        <div style={S.navRight}>
          <Link to="/" style={S.navBtn}>🗺 View Live Map</Link>
          <button onClick={logout} style={S.navBtn}>⏻ Logout</button>
        </div>
      </div>

      <div style={S.content}>

        <div style={S.stepCard}>
          <div style={S.stepHeader}>
            <span style={S.stepNum}>1</span>
            <div>
              <div style={S.stepTitle}>Select your Bus</div>
              <div style={S.stepDesc}>Select the bus dropdown & Assign</div>
            </div>
          </div>
          <select style={S.select} value={busId} onChange={e => setBusId(e.target.value)} disabled={tracking}>
            <option value="">-- Select Bus--</option>
            {buses.map(b => (
              <option key={b._id} value={b._id}>{b.busNumber} {b.routeId ? `— Route ${b.routeId.routeNumber}` : ''}</option>
            ))}
          </select>
        </div>

        <div style={S.stepCard}>
          <div style={S.stepHeader}>
            <span style={S.stepNum}>2</span>
            <div>
              <div style={S.stepTitle}>Trip Start/End </div>
              <div style={S.stepDesc}>Start Trip after share GPS</div>
            </div>
          </div>
          {!tracking ? (
            <button style={S.startBtn} onClick={startTrip}>▶ START TRIP — Share GPS</button>
          ) : (
            <button style={S.stopBtn} onClick={endTrip}>■ END TRIP — Stop Sharing</button>
          )}
        </div>

        <div style={S.stepCard}>
          <div style={S.stepHeader}>
            <span style={S.stepNum}>3</span>
            <div>
              <div style={S.stepTitle}>Live GPS Data </div>
              <div style={S.stepDesc}>Real time update data visibleto passenger</div>
            </div>
          </div>
          {!tracking ? (
            <div style={S.notTracking}>📍 No Active Tracking — Trip start </div>
          ) : (
            <div style={S.liveGrid}>
              <div style={S.liveItem}><div style={S.liveLabel}>LATITUDE</div><div style={S.liveVal}>{coords?.lat?.toFixed(6)||'—'}</div></div>
              <div style={S.liveItem}><div style={S.liveLabel}>LONGITUDE</div><div style={S.liveVal}>{coords?.lng?.toFixed(6)||'—'}</div></div>
              <div style={S.liveItem}><div style={S.liveLabel}>SPEED</div><div style={{...S.liveVal,color:'#1d4ed8'}}>{speed} km/h</div></div>
              <div style={S.liveItem}><div style={S.liveLabel}>STATUS</div><div style={{...S.liveVal,color:'#16a34a'}}>🟢 Sending...</div></div>
            </div>
          )}
        </div>

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
  content: { padding:'24px', maxWidth:'600px', margin:'0 auto' },
  stepCard: { background:'#fff', borderRadius:'14px', padding:'18px 20px', border:'1px solid #e2e8f0', marginBottom:'16px' },
  stepHeader: { display:'flex', gap:'12px', marginBottom:'14px' },
  stepNum: { width:'28px', height:'28px', borderRadius:'50%', background:'#dbeafe', color:'#1e40af', fontSize:'14px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  stepTitle: { fontSize:'14px', fontWeight:'700', color:'#0f172a' },
  stepDesc: { fontSize:'12px', color:'#64748b', marginTop:'2px', lineHeight:1.4 },
  select: { width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #e2e8f0', fontSize:'13px', outline:'none' },
  startBtn: { width:'100%', padding:'14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  stopBtn: { width:'100%', padding:'14px', background:'#dc2626', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  notTracking: { textAlign:'center', color:'#94a3b8', fontSize:'12px', padding:'24px' },
  liveGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  liveItem: { background:'#f8fafc', borderRadius:'10px', padding:'12px' },
  liveLabel: { fontSize:'10px', color:'#94a3b8', fontWeight:'700', marginBottom:'4px' },
  liveVal: { fontSize:'14px', fontWeight:'700', color:'#0f172a', fontFamily:'monospace' },
};

