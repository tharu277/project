import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const API = 'http://localhost:5000';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.DivIcon({
  html: `<div style="
    background:linear-gradient(135deg,#1d4ed8,#3b82f6);
    color:white;border-radius:50%;width:42px;height:42px;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;border:3px solid white;
    box-shadow:0 4px 14px rgba(29,78,216,0.5)">🚌</div>`,
  className:'', iconSize:[42,42], iconAnchor:[21,21],
});

const CENTER = [6.9271, 79.8612];

// Auto-fit map to bus markers
function FitBounds({ buses }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(buses) && buses.length > 0) {
      const bounds = buses
        .filter(b => b?.currentLocation?.lat && b?.currentLocation?.lng)
        .map(b => [b.currentLocation.lat, b.currentLocation.lng]);
      if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [buses, map]);
  return null;
}

export default function LiveTracking() {
  const [buses,    setBuses]    = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout }        = useAuth();

  useEffect(() => {
    const fetchBuses = () => {
      axios.get(`${API}/api/location/active`)
        .then(r => {
          // Handle direct array OR object response wrapper (e.g., r.data.buses)
          const data = Array.isArray(r.data) ? r.data : (r.data?.buses || []);
          setBuses(data);
        })
        .catch(err => {
          console.error('Failed to fetch buses:', err);
          setBuses([]); // Guarantee buses remains an array on error
        })
        .finally(() => setLoading(false));
    };

    fetchBuses();
    const iv = setInterval(fetchBuses, 5000);
    return () => clearInterval(iv);
  }, []);

const safeBuses = Array.isArray(buses) ? buses : [];

  const filtered = safeBuses.filter(b =>
    b.busNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.routeId?.routeNumber?.includes(search) ||
    b.routeId?.origin?.toLowerCase().includes(search.toLowerCase()) ||
    b.routeId?.destination?.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div style={S.page}>

      {/* ── NAVBAR ── */}
      <nav style={S.nav}>
        <div style={S.navBrand}>
          <div style={S.navLogo}>🚌</div>
          <div>
            <div style={S.navTitle}>SmartBus</div>
            <div style={S.navSub}>Super Line Travels</div>
          </div>
        </div>

        <div style={S.navCenter}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input
              style={S.searchInput}
              placeholder="Search by Bus Number or Route..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={S.clearBtn} onClick={()=>setSearch('')}>✕</button>
            )}
          </div>
        </div>

        <div style={S.navActions}>
          {!user ? (
            <>
              <Link to="/login"    style={S.navLinkBtn}>Sign in</Link>
              <Link to="/register" style={S.navRegBtn}>Register</Link>
            </>
          ) : (
            <>
              {user.role==='admin'     && <Link to="/admin"     style={S.navLinkBtn}>🛡 Admin</Link>}
              {user.role==='driver'    && <Link to="/driver"    style={S.navLinkBtn}>🚗 Driver</Link>}
              {user.role==='passenger' && <Link to="/passenger" style={S.navLinkBtn}>📋 Dashboard</Link>}
              <div style={S.userPill}>
                <div style={S.userAvatar}>{user.name?.charAt(0).toUpperCase()}</div>
                <span style={S.userPillName}>{user.name}</span>
              </div>
              <button onClick={logout} style={S.logoutBtn}>Logout</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.heroTag}>🇱🇰 Real-Time GPS Tracking</div>
          <h1 style={S.heroTitle}>  Track Your Bus<br/> in Real Time!<br/></h1>
          <p style={S.heroDesc}>
            Once the driver starts the trip, the live bus location is displayed
  on the map together with the current speed, route information,
  and estimated arrival time (ETA).
          </p>
          <div style={S.heroBtns}>
            {!user && <Link to="/register" style={S.heroBtnPrimary}> ✨ Create a Free Account</Link>}
            <a href="#map" style={S.heroBtnSecondary}> 🗺 View Live Map ↓</a>
          </div>
        </div>
        <div style={S.heroRight}>
          <div style={S.statsGrid}>
            <div style={S.statBox}>
              <div style={S.statNum}>{buses.length}</div>
              <div style={S.statLabel}>Total Buses</div>
            </div>
            <div style={{...S.statBox, ...S.statBoxGreen}}>
              <div style={{...S.statNum, color:'#22c55e'}}>{filtered.length}</div>
              <div style={S.statLabel}>Active Now</div>
            </div>
            <div style={{...S.statBox, ...S.statBoxAmber}}>
              <div style={{...S.statNum, color:'#f59e0b'}}>5s</div>
              <div style={S.statLabel}>Update Rate</div>
            </div>
            <div style={{...S.statBox, ...S.statBoxPurple}}>
              <div style={{...S.statNum, color:'#a855f7'}}>GPS</div>
              <div style={S.statLabel}>Live Signal</div>
            </div>
          </div>
          {/* Feature chips */}
          <div style={S.featureChips}>
            {['📍 Real-time GPS','⏱ ETA Calculation','🔍 Bus Search','🗺 Live Map'].map((f,i)=>(
              <span key={i} style={S.featureChip}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={S.howSection}>
        <div style={S.howTitle}>How It Works</div>
        <div style={S.howGrid}>
          {[
            {  icon:'📱',step:'1',title:'Create an Account',desc:'Create a free account in less than one minute.' },
            {  icon:'🔍',step:'2',title:'Search for a Bus',desc:'Enter the route number or destination.' },
            {  icon:'🗺',step:'3',title:'View on the Map',desc:'Track the live location of your bus on the map.' },
            {  icon:'⏱',step:'4',title:'Check Estimated Arrival Time',desc:'View the estimated arrival time (ETA) of your bus.' },
          ].map((item,i) => (
            <div key={i} style={S.howCard}>
              <div style={S.howStep}>{item.step}</div>
              <div style={S.howIcon}>{item.icon}</div>
              <div style={S.howCardTitle}>{item.title}</div>
              <div style={S.howCardDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT: MAP + BUS LIST ── */}
      <div id="map" style={S.mainContent}>

        {/* LEFT — Bus List */}
        <div style={S.leftPanel}>
          <div style={S.panelHeader}>
            <div style={S.panelTitle}>
              🚌 Live Buses
              <span style={S.countBadge}>{filtered.length}</span>
            </div>
            <div style={S.livePill}>
              <span style={S.liveDot}></span>Auto
            </div>
          </div>

          <div style={S.busScrollList}>
            {loading && (
              <div style={S.loadingBox}>
                <div style={S.spinner}></div>
                <span style={{ color:'#94a3b8', fontSize:'13px' }}>Loading buses...</span>
              </div>
            )}

            {!loading && filtered.length===0 && (
              <div style={S.emptyBox}>
                <div style={{ fontSize:'40px', marginBottom:'10px' }}>🚌</div>
                <div style={S.emptyTitle}>No Active Buses Availabl</div>
                <div style={S.emptySub}> No drivers have started a trip yet.</div>
              </div>
            )}

            {filtered.map(bus => (
              <div key={bus._id}
                style={{...S.busItem, ...(selected?._id===bus._id ? S.busItemSel : {})}}
                onClick={()=>setSelected(selected?._id===bus._id ? null : bus)}>
                <div style={S.busItemLeft}>
                  <div style={S.busItemIcon}>🚌</div>
                  <div>
                    <div style={S.busItemNum}>{bus.busNumber}</div>
                    {bus.routeId && (
                      <div style={S.busItemRoute}>
                        {bus.routeId.origin} → {bus.routeId.destination}
                      </div>
                    )}
                  </div>
                </div>
                <div style={S.busItemRight}>
                  <span style={S.busSpeedBadge}>{Math.round(bus.speed||0)}<small> km/h</small></span>
                  <span style={S.busStatusDot}>🟢</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected bus detail */}
          {selected && (
            <div style={S.selectedDetail}>
              <div style={S.sdTitle}>📋 {selected.busNumber} Details</div>
              <div style={S.sdGrid}>
                <div style={S.sdItem}><div style={S.sdLabel}>Route</div><div style={S.sdVal}>{selected.routeId?.routeNumber||'—'}</div></div>
                <div style={S.sdItem}><div style={S.sdLabel}>Speed</div><div style={{...S.sdVal,color:'#1d4ed8'}}>{Math.round(selected.speed||0)} km/h</div></div>
                <div style={S.sdItem}><div style={S.sdLabel}>From</div><div style={S.sdVal}>{selected.routeId?.origin||'—'}</div></div>
                <div style={S.sdItem}><div style={S.sdLabel}>To</div><div style={S.sdVal}>{selected.routeId?.destination||'—'}</div></div>
              </div>
              {selected.currentLocation?.lat && (
                <div style={S.sdCoords}>
                  📍 {selected.currentLocation.lat.toFixed(5)}, {selected.currentLocation.lng.toFixed(5)}
                </div>
              )}
              <button style={S.sdClose} onClick={()=>setSelected(null)}>✕ Close</button>
            </div>
          )}
        </div>

        {/* RIGHT — Map */}
        <div style={S.mapWrap}>
          <MapContainer
            center={CENTER} zoom={11}
            style={{ width:'100%', height:'100%' }}
            scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds buses={filtered} />
            {filtered.map(bus => (
              bus.currentLocation?.lat && (
                <Marker
                  key={bus._id}
                  position={[bus.currentLocation.lat, bus.currentLocation.lng]}
                  icon={busIcon}
                  eventHandlers={{ click:()=>setSelected(bus) }}>
                  <Popup>
                    <div style={{ minWidth:'180px', fontFamily:"'Segoe UI',sans-serif" }}>
                      <div style={{ fontWeight:'700', fontSize:'15px', color:'#1e40af', marginBottom:'8px' }}>
                        🚌 {bus.busNumber}
                      </div>
                      {bus.routeId && (
                        <div style={{ fontSize:'12px', color:'#374151', marginBottom:'8px', lineHeight:1.5 }}>
                          <strong>Route {bus.routeId.routeNumber}</strong><br/>
                          {bus.routeId.origin} → {bus.routeId.destination}
                        </div>
                      )}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                        <div style={{ background:'#f8fafc', borderRadius:'6px', padding:'6px', textAlign:'center' }}>
                          <div style={{ fontSize:'9px', color:'#94a3b8' }}>SPEED</div>
                          <div style={{ fontSize:'13px', fontWeight:'700', color:'#1d4ed8' }}>{Math.round(bus.speed||0)} km/h</div>
                        </div>
                        <div style={{ background:'#dcfce7', borderRadius:'6px', padding:'6px', textAlign:'center' }}>
                          <div style={{ fontSize:'9px', color:'#16a34a' }}>STATUS</div>
                          <div style={{ fontSize:'12px', fontWeight:'700', color:'#166534' }}>On Trip</div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>

          {/* Map overlay badges */}
          <div style={S.mapOverlayTop}>
            <div style={S.mapBadge}>OpenStreetMap — Sri Lanka</div>
            <div style={S.mapLiveBadge}><span style={S.liveDot}></span> Live</div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerContent}>
          <div style={S.footerBrand}>
            <span style={{ fontSize:'20px' }}>🚌</span>
            <span style={S.footerTitle}>SmartBus — Super Line Travels</span>
          </div>
          <div style={S.footerLinks}>
            <Link to="/login"    style={S.footerLink}>Login</Link>
            <Link to="/register" style={S.footerLink}>Register</Link>
            {user?.role==='passenger' && <Link to="/passenger" style={S.footerLink}>Dashboard</Link>}
          </div>
          <div style={S.footerCopy}>© 2026 Smart Bus Tracking System</div>
        </div>
      </footer>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .leaflet-container{font-family:'Segoe UI',sans-serif!important}
        #map{scroll-margin-top:70px}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}

/* ─── STYLES ─── */
const S = {
  page: { minHeight:'100vh', background:'#f8fafc', fontFamily:"'Segoe UI',sans-serif", display:'flex', flexDirection:'column' },

  // Navbar
  nav: { position:'sticky', top:0, zIndex:1000, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e8f0', padding:'0 28px', height:'64px', display:'flex', alignItems:'center', gap:'16px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)' },
  navBrand: { display:'flex', alignItems:'center', gap:'10px', flexShrink:0 },
  navLogo: { width:'40px', height:'40px', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', boxShadow:'0 2px 8px rgba(29,78,216,0.3)' },
  navTitle: { fontSize:'17px', fontWeight:'800', color:'#0f172a', letterSpacing:'-0.4px' },
  navSub: { fontSize:'10px', color:'#94a3b8' },
  navCenter: { flex:1, display:'flex', justifyContent:'center' },
  searchWrap: { display:'flex', alignItems:'center', gap:'8px', background:'#f1f5f9', border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'0 14px', height:'42px', width:'100%', maxWidth:'420px', transition:'border-color .2s' },
  searchIcon: { fontSize:'15px', color:'#94a3b8', flexShrink:0 },
  searchInput: { flex:1, border:'none', background:'transparent', fontSize:'13px', outline:'none', color:'#334155' },
  clearBtn: { border:'none', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:'12px', padding:'2px 4px' },
  navActions: { display:'flex', gap:'8px', alignItems:'center', flexShrink:0 },
  navLinkBtn: { padding:'7px 14px', background:'transparent', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'13px', fontWeight:'500', cursor:'pointer', textDecoration:'none' },
  navRegBtn: { padding:'7px 16px', background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff', border:'none', borderRadius:'9px', fontSize:'13px', fontWeight:'600', cursor:'pointer', textDecoration:'none', boxShadow:'0 2px 8px rgba(29,78,216,0.25)' },
  userPill: { display:'flex', alignItems:'center', gap:'8px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'99px', padding:'5px 12px 5px 5px' },
  userAvatar: { width:'26px', height:'26px', borderRadius:'50%', background:'#1d4ed8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700' },
  userPillName: { fontSize:'13px', fontWeight:'500', color:'#334155' },
  logoutBtn: { padding:'7px 14px', background:'transparent', color:'#94a3b8', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'12px', cursor:'pointer' },

  // Hero
  hero: { background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 45%,#1d4ed8 100%)', padding:'56px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'40px', position:'relative', overflow:'hidden' },
  heroLeft: { flex:1, maxWidth:'480px', animation:'fadeIn .6s ease' },
  heroTag: { display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'99px', padding:'5px 14px', fontSize:'12px', color:'#93c5fd', fontWeight:'600', marginBottom:'16px' },
  heroTitle: { fontSize:'42px', fontWeight:'900', color:'#fff', lineHeight:1.15, marginBottom:'16px', letterSpacing:'-1px' },
  heroDesc: { fontSize:'15px', color:'#93c5fd', lineHeight:1.7, marginBottom:'24px' },
  heroBtns: { display:'flex', gap:'12px', flexWrap:'wrap' },
  heroBtnPrimary: { padding:'13px 24px', background:'#fff', color:'#1d4ed8', borderRadius:'12px', fontSize:'14px', fontWeight:'700', textDecoration:'none', boxShadow:'0 4px 16px rgba(255,255,255,0.2)' },
  heroBtnSecondary: { padding:'13px 24px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px', fontSize:'14px', fontWeight:'600', textDecoration:'none' },
  heroRight: { flexShrink:0 },
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' },
  statBox: { background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'14px', padding:'16px', textAlign:'center', backdropFilter:'blur(10px)' },
  statBoxGreen: { background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)' },
  statBoxAmber: { background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' },
  statBoxPurple: { background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.2)' },
  statNum: { fontSize:'28px', fontWeight:'800', color:'#fff', lineHeight:1 },
  statLabel: { fontSize:'10px', color:'#93c5fd', marginTop:'4px', textTransform:'uppercase', letterSpacing:'.06em' },
  featureChips: { display:'flex', flexWrap:'wrap', gap:'6px' },
  featureChip: { background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'99px', padding:'5px 12px', fontSize:'11px', color:'#bfdbfe', fontWeight:'500' },

  // How it works
  howSection: { background:'#fff', padding:'40px 28px', borderBottom:'1px solid #e2e8f0' },
  howTitle: { fontSize:'20px', fontWeight:'800', color:'#0f172a', textAlign:'center', marginBottom:'24px', letterSpacing:'-0.4px' },
  howGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px', maxWidth:'800px', margin:'0 auto' },
  howCard: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'16px', padding:'20px', textAlign:'center' },
  howStep: { width:'28px', height:'28px', borderRadius:'50%', background:'#dbeafe', color:'#1d4ed8', fontSize:'13px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' },
  howIcon: { fontSize:'28px', marginBottom:'10px' },
  howCardTitle: { fontSize:'13px', fontWeight:'700', color:'#0f172a', marginBottom:'4px' },
  howCardDesc: { fontSize:'12px', color:'#64748b', lineHeight:1.5 },

  // Main content
  mainContent: { display:'flex', flex:1, height:'560px' },

  // Left panel
  leftPanel: { width:'300px', background:'#fff', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' },
  panelHeader: { padding:'14px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  panelTitle: { fontSize:'13px', fontWeight:'700', color:'#0f172a', display:'flex', alignItems:'center', gap:'8px' },
  countBadge: { background:'#dbeafe', color:'#1e40af', fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'99px' },
  livePill: { display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#16a34a', fontWeight:'600' },
  liveDot: { width:'7px', height:'7px', borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 1.5s ease infinite' },
  busScrollList: { flex:1, overflowY:'auto', padding:'8px' },
  loadingBox: { display:'flex', alignItems:'center', gap:'10px', padding:'20px 10px' },
  spinner: { width:'18px', height:'18px', border:'2px solid #e2e8f0', borderTopColor:'#1d4ed8', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 },
  emptyBox: { textAlign:'center', padding:'36px 16px' },
  emptyTitle: { fontSize:'14px', fontWeight:'600', color:'#334155', marginBottom:'4px' },
  emptySub: { fontSize:'12px', color:'#94a3b8', lineHeight:1.5 },
  busItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:'10px', cursor:'pointer', marginBottom:'4px', transition:'background .15s' },
  busItemSel: { background:'#eff6ff', outline:'1.5px solid #1d4ed8' },
  busItemLeft: { display:'flex', alignItems:'center', gap:'10px' },
  busItemIcon: { width:'36px', height:'36px', background:'#dbeafe', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 },
  busItemNum: { fontSize:'13px', fontWeight:'700', color:'#0f172a', marginBottom:'2px' },
  busItemRoute: { fontSize:'11px', color:'#64748b', lineHeight:1.3, maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  busItemRight: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' },
  busSpeedBadge: { fontSize:'12px', fontWeight:'700', color:'#1d4ed8', background:'#dbeafe', padding:'3px 8px', borderRadius:'99px' },
  busStatusDot: { fontSize:'10px' },
  selectedDetail: { borderTop:'1px solid #e2e8f0', padding:'12px 14px', background:'#f8fafc', flexShrink:0, animation:'fadeIn .2s ease' },
  sdTitle: { fontSize:'12px', fontWeight:'700', color:'#0f172a', marginBottom:'8px' },
  sdGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'8px' },
  sdItem: { background:'#fff', borderRadius:'6px', padding:'6px 8px', border:'1px solid #e2e8f0' },
  sdLabel: { fontSize:'9px', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', marginBottom:'2px' },
  sdVal: { fontSize:'12px', fontWeight:'600', color:'#334155' },
  sdCoords: { fontSize:'10px', color:'#94a3b8', marginBottom:'8px', fontFamily:'monospace' },
  sdClose: { width:'100%', padding:'6px', background:'#f1f5f9', border:'none', borderRadius:'6px', fontSize:'11px', color:'#64748b', cursor:'pointer', fontWeight:'600' },

  // Map
  mapWrap: { flex:1, position:'relative' },
  mapOverlayTop: { position:'absolute', top:'12px', right:'12px', zIndex:1000, display:'flex', gap:'8px' },
  mapBadge: { background:'rgba(255,255,255,0.95)', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', fontWeight:'600', color:'#334155', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', backdropFilter:'blur(8px)' },
  mapLiveBadge: { background:'rgba(255,255,255,0.95)', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', fontWeight:'600', color:'#16a34a', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:'5px', backdropFilter:'blur(8px)' },

  // Footer
  footer: { background:'#0f172a', padding:'24px 28px', flexShrink:0 },
  footerContent: { display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' },
  footerBrand: { display:'flex', alignItems:'center', gap:'8px' },
  footerTitle: { fontSize:'14px', fontWeight:'600', color:'#94a3b8' },
  footerLinks: { display:'flex', gap:'16px' },
  footerLink: { fontSize:'13px', color:'#64748b', textDecoration:'none' },
  footerCopy: { fontSize:'12px', color:'#475569' },
};