import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000';

// ── ETA calculator (Haversine) ──────────────────────────────────────────────
function calcETA(busLoc, stopLoc, speed) {
  if (!busLoc || !stopLoc) return null;
  const R = 6371;
  const dLat = (stopLoc.lat - busLoc.lat) * Math.PI / 180;
  const dLon = (stopLoc.lng - busLoc.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(busLoc.lat*Math.PI/180) * Math.cos(stopLoc.lat*Math.PI/180) * Math.sin(dLon/2)**2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const spd = speed > 0 ? speed : 30;
  return Math.round((dist / spd) * 60);
}

// ── Mock timetable data  ──
const TIMETABLE = {
  "138": ["05:30","06:00","06:30","07:00","07:30","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","17:30","18:00","19:00","20:00","21:00"],
  "187": ["05:45","06:15","07:00","07:45","08:30","09:30","10:30","11:30","12:30","13:30","14:30","15:30","16:30","17:00","17:30","18:30","19:30","20:30"],
  "103": ["06:00","07:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00"],
};

export default function PassengerDashboard() {
  const { user, logout } = useAuth();

  const [tab, setTab]         = useState('search');   // search | timetable | live
  const [routes, setRoutes]   = useState([]);
  const [buses,  setBuses]    = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);

  // Search state
  const [from, setFrom]       = useState('');
  const [to,   setTo]         = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);

  // Timetable state
  const [selRoute, setSelRoute] = useState('');

  // Live state
  const [selLiveRoute, setSelLiveRoute] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/routes`).then(r => setRoutes(r.data)).catch(()=>{});
    axios.get(`${API}/api/buses`).then(r => setBuses(r.data)).catch(()=>{});
    axios.get(`${API}/api/location/active`).then(r => setActiveBuses(r.data)).catch(()=>{});
    const iv = setInterval(() => {
      axios.get(`${API}/api/location/active`).then(r => setActiveBuses(r.data)).catch(()=>{});
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // All unique stop names for dropdowns
  const allStops = [...new Set(
    routes.flatMap(r => [r.origin, r.destination, ...(r.stops||[]).map(s=>s.name)])
      .filter(Boolean)
  )].sort();

  // Search handler
  const handleSearch = () => {
    setSearched(true);
    if (!from && !to) { setSearchResults(routes); return; }
    const res = routes.filter(r => {
      const allStopNames = [r.origin, r.destination, ...(r.stops||[]).map(s=>s.name)].map(s=>s?.toLowerCase());
      const fromMatch = !from || allStopNames.some(s=>s?.includes(from.toLowerCase()));
      const toMatch   = !to   || allStopNames.some(s=>s?.includes(to.toLowerCase()));
      return fromMatch && toMatch;
    });
    setSearchResults(res);
  };

  // Get next bus time
  const getNextTime = (routeNum) => {
    const times = TIMETABLE[routeNum] || [];
    if (!times.length) return null;
    const now = new Date();
    const nowMins = now.getHours()*60 + now.getMinutes();
    const next = times.find(t => {
      const [h,m] = t.split(':').map(Number);
      return h*60+m > nowMins;
    });
    return next || times[0];
  };

  // Get live bus for route
  const getLiveBusForRoute = (routeId) =>
    activeBuses.find(b => b.routeId?._id === routeId || b.routeId === routeId);

  return (
    <div style={S.page}>

      {/* ── NAV ── */}
      <div style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.navIcon}>🚌</div>
          <div>
            <div style={S.navTitle}>SmartBus</div>
            <div style={S.navSub}>Super Line Travels</div>
          </div>
        </div>
        <div style={S.navRight}>
          <Link to="/" style={S.navLink}>🗺 Live Map</Link>
          <div style={S.userChip}>
            <div style={S.userAva}>{user?.name?.charAt(0).toUpperCase()}</div>
            <span style={S.userName}>{user?.name}</span>
          </div>
          <button onClick={logout} style={S.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={S.hero}>
        <div style={S.heroContent}>
          <div style={S.heroTitle}></div>
          <div style={S.heroSub}>Search Bus, View Timetable, live tracking </div>
        </div>
        <div style={S.heroStats}>
          <div style={S.heroStat}><span style={S.heroStatNum}>{routes.length}</span><span style={S.heroStatLabel}>Routes</span></div>
          <div style={S.heroStat}><span style={S.heroStatNum}>{buses.length}</span><span style={S.heroStatLabel}>Buses</span></div>
          <div style={S.heroStat}><span style={S.heroStatNum}>{activeBuses.length}</span><span style={S.heroStatLabel}>Live Now</span></div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={S.tabRow}>
        {[
          { id:'search',    icon:'🔍', label:'Bus Search'   },
          { id:'timetable', icon:'🕐', label:'Time Table'   },
          { id:'live',      icon:'📍', label:'Live Tracking'},
        ].map(t => (
          <button key={t.id}
            style={{ ...S.tabBtn, ...(tab===t.id ? S.tabBtnAct : {}) }}
            onClick={() => setTab(t.id)}>
            <span style={{ fontSize:'18px' }}>{t.icon}</span>
            <span style={{ fontSize:'13px', fontWeight:'600' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={S.body}>

        {/* ══════════ TAB 1 — BUS SEARCH ══════════ */}
        {tab==='search' && (
          <div>
            {/* Search Card */}
            <div style={S.searchCard}>
              <div style={S.searchTitle}>🔍 travel destination</div>
              <div style={S.searchGrid}>
                <div style={S.searchField}>
                  <label style={S.searchLabel}>📍 From (From)</label>
                  <select style={S.searchSelect} value={from} onChange={e=>setFrom(e.target.value)}>
                    <option value="">-- Select --</option>
                    {allStops.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={S.swapCol}>
                  <button style={S.swapBtn} onClick={()=>{const t=from;setFrom(to);setTo(t);}}>⇅</button>
                </div>
                <div style={S.searchField}>
                  <label style={S.searchLabel}>🏁 To (To)</label>
                  <select style={S.searchSelect} value={to} onChange={e=>setTo(e.target.value)}>
                    <option value="">-- Select  --</option>
                    {allStops.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button style={S.searchBtn} onClick={handleSearch}>🔍Select Bus</button>
            </div>

            {/* Results */}
            {searched && (
              <div>
                <div style={S.resultsHeader}>
                  {searchResults.length > 0
                    ? `✅ ${searchResults.length} Route${searchResults.length>1?'s':''} `
                    : '❌ No available direct route'}
                </div>

                {searchResults.length===0 && (
                  <div style={S.noResult}>
                    <div style={{ fontSize:'48px', marginBottom:'12px' }}>😔</div>
                    <div style={{ fontWeight:'700', color:'#334155', marginBottom:'6px' }}>Not available direct Buses</div>
                    <div style={{ color:'#94a3b8', fontSize:'13px' }}>Available option</div>
                  </div>
                )}

                <div style={S.resultsList}>
                  {searchResults.map(route => {
                    const liveBus    = getLiveBusForRoute(route._id);
                    const nextTime   = getNextTime(route.routeNumber);
                    const eta        = liveBus ? calcETA(liveBus.currentLocation, route.stops?.[0], liveBus.speed) : null;
                    return (
                      <div key={route._id} style={S.resultCard}>
                        {liveBus && <div style={S.liveBadge}>🟢 OnTrip!</div>}
                        <div style={S.resultTop}>
                          <div style={S.resultRouteNum}>Route {route.routeNumber}</div>
                          <div style={S.resultTime}>
                            {nextTime && <span style={S.nextTimeBadge}>⏰ Next: {nextTime}</span>}
                          </div>
                        </div>
                        <div style={S.resultPath}>
                          <div style={S.pathPoint}><span style={S.pathDotGreen}></span>{route.origin}</div>
                          <div style={S.pathLine}>
                            {route.stops?.slice(1,-1).map((s,i)=>(
                              <div key={i} style={S.pathStop}>└ {s.name}</div>
                            ))}
                          </div>
                          <div style={S.pathPoint}><span style={S.pathDotRed}></span>{route.destination}</div>
                        </div>
                        <div style={S.resultMeta}>
                          <span style={S.metaChip}>📏 {route.totalDistance||'?'} km</span>
                          <span style={S.metaChip}>⏱ ~{route.estimatedTime||'?'} min</span>
                          <span style={S.metaChip}>🛑 {route.stops?.length||0} stops</span>
                          {eta!==null && <span style={{...S.metaChip,...S.metaChipBlue}}>📍 ETA: {eta} min</span>}
                        </div>
                        {liveBus && (
                          <div style={S.liveInfo}>
                            🚌 Bus <strong>{liveBus.busNumber}</strong> OnTrip — Speed: {Math.round(liveBus.speed||0)} km/h
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!searched && (
              <div style={S.allRoutesWrap}>
                <div style={S.allRoutesTitle}>📋 All Routes</div>
                <div style={S.allRoutesList}>
                  {routes.map(r => (
                    <div key={r._id} style={S.allRouteItem}
                      onClick={()=>{ setFrom(r.origin); setTo(r.destination); setSearched(true); setSearchResults([r]); }}>
                      <div style={S.ariRouteNum}>Route {r.routeNumber}</div>
                      <div style={S.ariRoutePath}>{r.origin} → {r.destination}</div>
                      <div style={S.ariMeta}>
                        {r.totalDistance||'?'} km · ~{r.estimatedTime||'?'} min
                        {getLiveBusForRoute(r._id) && <span style={S.ariLive}>🟢 Live</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB 2 — TIMETABLE ══════════ */}
        {tab==='timetable' && (
          <div>
            <div style={S.ttCard}>
              <div style={S.ttTitle}>🕐 Bus Time Table</div>
              <div style={S.ttDesc}>Select Route — Available time</div>

              <select style={S.ttSelect} value={selRoute} onChange={e=>setSelRoute(e.target.value)}>
                <option value="">-- SelectRoute --</option>
                {routes.map(r=>(
                  <option key={r._id} value={r.routeNumber}>
                    Route {r.routeNumber}: {r.origin} → {r.destination}
                  </option>
                ))}
              </select>

              {selRoute && (
                <div style={S.ttBody}>
                  {(() => {
                    const route = routes.find(r=>r.routeNumber===selRoute);
                    const times = TIMETABLE[selRoute] || [];
                    const now   = new Date();
                    const nowMins = now.getHours()*60+now.getMinutes();

                    return (
                      <>
                        <div style={S.ttRouteInfo}>
                          <span style={S.ttRouteNum}>Route {selRoute}</span>
                          {route && <span style={S.ttRoutePath}>{route.origin} → {route.destination}</span>}
                        </div>

                        {times.length===0 ? (
                          <div style={S.ttNoData}>No Available Timetable </div>
                        ) : (
                          <div style={S.ttGrid}>
                            {times.map((t,i) => {
                              const [h,m] = t.split(':').map(Number);
                              const tMins = h*60+m;
                              const isPast   = tMins < nowMins;
                              const isNext   = !isPast && times.slice(0,i).every(prev=>{
                                const [ph,pm]=prev.split(':').map(Number); return ph*60+pm<nowMins;
                              });
                              return (
                                <div key={i} style={{
                                  ...S.ttTime,
                                  ...(isPast ? S.ttTimePast : {}),
                                  ...(isNext ? S.ttTimeNext : {}),
                                }}>
                                  {isNext && <div style={S.ttNextLabel}>NEXT</div>}
                                  <div style={S.ttTimeVal}>{t}</div>
                                  {isPast && <div style={S.ttPastLabel}>Started</div>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Stops */}
                        {route?.stops?.length > 0 && (
                          <div style={S.ttStops}>
                            <div style={S.ttStopsTitle}>🛑 Bus Stops (Stops)</div>
                            {route.stops.map((s,i)=>(
                              <div key={i} style={S.ttStopItem}>
                                <div style={S.ttStopNum}>{i+1}</div>
                                <div style={S.ttStopName}>{s.name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ TAB 3 — LIVE TRACKING ══════════ */}
        {tab==='live' && (
          <div>
            <div style={S.liveCard}>
              <div style={S.liveTitle}>📍 Real-Time Bus Tracking</div>
              <div style={S.liveDesc}>Active buses</div>

              <select style={S.ttSelect} value={selLiveRoute} onChange={e=>setSelLiveRoute(e.target.value)}>
                <option value="">-- filter route(optional) --</option>
                {routes.map(r=>(
                  <option key={r._id} value={r._id}>Route {r.routeNumber}: {r.origin} → {r.destination}</option>
                ))}
              </select>
            </div>

            {activeBuses.length===0 ? (
              <div style={S.noLive}>
                <div style={{ fontSize:'48px', marginBottom:'12px' }}>🚌</div>
                <div style={{ fontWeight:'700', color:'#334155', marginBottom:'6px' }}>No Active Buses</div>
                <div style={{ color:'#94a3b8', fontSize:'13px' }}>No available start buses</div>
              </div>
            ) : (
              <div style={S.liveBusList}>
                {activeBuses
                  .filter(b => !selLiveRoute || b.routeId?._id===selLiveRoute || b.routeId===selLiveRoute)
                  .map(bus => {
                    const route = routes.find(r=>r._id===bus.routeId?._id || r._id===bus.routeId);
                    const nextStop = route?.stops?.[0];
                    const eta = calcETA(bus.currentLocation, nextStop, bus.speed);
                    return (
                      <div key={bus._id} style={S.liveBusCard}>
                        <div style={S.lbcHeader}>
                          <div style={S.lbcIconWrap}>🚌</div>
                          <div style={{ flex:1 }}>
                            <div style={S.lbcNum}>{bus.busNumber}</div>
                            {route && <div style={S.lbcRoute}>Route {route.routeNumber}: {route.origin} → {route.destination}</div>}
                          </div>
                          <div style={S.lbcStatus}>🟢 OnTrip</div>
                        </div>
                        <div style={S.lbcGrid}>
                          <div style={S.lbcItem}>
                            <div style={S.lbcLabel}>SPEED</div>
                            <div style={S.lbcVal}>{Math.round(bus.speed||0)} km/h</div>
                          </div>
                          {bus.currentLocation?.lat && (
                            <div style={S.lbcItem}>
                              <div style={S.lbcLabel}>LOCATION</div>
                              <div style={{...S.lbcVal,fontSize:'11px',fontFamily:'monospace'}}>
                                {bus.currentLocation.lat.toFixed(4)}, {bus.currentLocation.lng.toFixed(4)}
                              </div>
                            </div>
                          )}
                          {eta!==null && (
                            <div style={S.lbcItem}>
                              <div style={S.lbcLabel}>NEXT STOP ETA</div>
                              <div style={{...S.lbcVal,color:'#1d4ed8'}}>{eta} min</div>
                            </div>
                          )}
                          <div style={S.lbcItem}>
                            <div style={S.lbcLabel}>DRIVER</div>
                            <div style={S.lbcVal}>{bus.driverId?.name||'—'}</div>
                          </div>
                        </div>
                        {route?.stops && (
                          <div style={S.lbcStopsRow}>
                            {route.stops.map((s,i)=>(
                              <span key={i} style={S.lbcStop}>{s.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────── STYLES ─────────── */
const S = {
  page: { minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Segoe UI',sans-serif" },

  // Nav
  nav: { background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  navLeft: { display:'flex', alignItems:'center', gap:'10px' },
  navIcon: { width:'38px', height:'38px', background:'#1d4ed8', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' },
  navTitle: { fontSize:'16px', fontWeight:'700', color:'#0f172a', letterSpacing:'-0.3px' },
  navSub: { fontSize:'10px', color:'#94a3b8' },
  navRight: { display:'flex', gap:'10px', alignItems:'center' },
  navLink: { color:'#1d4ed8', fontSize:'13px', fontWeight:'600', textDecoration:'none' },
  userChip: { display:'flex', alignItems:'center', gap:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'99px', padding:'5px 12px 5px 6px' },
  userAva: { width:'24px', height:'24px', borderRadius:'50%', background:'#1d4ed8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700' },
  userName: { fontSize:'13px', fontWeight:'500', color:'#334155' },
  logoutBtn: { padding:'6px 14px', background:'transparent', color:'#e92636', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'12px', cursor:'pointer' },

  // Hero
  hero: { background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%)', padding:'28px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  heroContent: { },
  heroTitle: { fontSize:'26px', fontWeight:'800', color:'#fff', marginBottom:'6px', letterSpacing:'-0.5px' },
  heroSub: { fontSize:'13px', color:'#93c5fd' },
  heroStats: { display:'flex', gap:'20px' },
  heroStat: { display:'flex', flexDirection:'column', alignItems:'center', background:'rgba(255,255,255,0.1)', borderRadius:'10px', padding:'12px 18px' },
  heroStatNum: { fontSize:'22px', fontWeight:'700', color:'#fff', lineHeight:1 },
  heroStatLabel: { fontSize:'10px', color:'#93c5fd', marginTop:'3px' },

  // Tabs
  tabRow: { display:'flex', background:'#fff', borderBottom:'1px solid #e2e8f0' },
  tabBtn: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', padding:'14px', border:'none', background:'transparent', cursor:'pointer', color:'#94a3b8', borderBottom:'3px solid transparent' },
  tabBtnAct: { color:'#1d4ed8', borderBottomColor:'#1d4ed8' },

  body: { padding:'20px 24px', maxWidth:'800px', margin:'0 auto' },

  // Search
  searchCard: { background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #e2e8f0', marginBottom:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  searchTitle: { fontSize:'15px', fontWeight:'700', color:'#0f172a', marginBottom:'16px' },
  searchGrid: { display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'12px', alignItems:'end', marginBottom:'14px' },
  searchField: { },
  searchLabel: { display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'6px' },
  searchSelect: { width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1.5px solid #e2e8f0', fontSize:'14px', outline:'none', color:'#0f172a', background:'#fff' },
  swapCol: { display:'flex', justifyContent:'center', alignItems:'center', paddingBottom:'4px' },
  swapBtn: { width:'38px', height:'38px', borderRadius:'50%', background:'#dbeafe', border:'none', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#1d4ed8' },
  searchBtn: { width:'100%', padding:'14px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700', cursor:'pointer' },

  // Results
  resultsHeader: { fontSize:'14px', fontWeight:'700', color:'#0f172a', marginBottom:'12px', padding:'10px 14px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0' },
  noResult: { textAlign:'center', padding:'40px', background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0' },
  resultsList: { display:'flex', flexDirection:'column', gap:'12px' },
  resultCard: { background:'#fff', borderRadius:'16px', padding:'18px', border:'1px solid #e2e8f0', position:'relative', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  liveBadge: { position:'absolute', top:'14px', right:'14px', background:'#dcfce7', color:'#16a34a', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'99px' },
  resultTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' },
  resultRouteNum: { fontSize:'16px', fontWeight:'800', color:'#1e40af' },
  resultTime: { },
  nextTimeBadge: { background:'#fef9c3', color:'#854d0e', fontSize:'12px', fontWeight:'700', padding:'4px 10px', borderRadius:'99px' },
  resultPath: { marginBottom:'14px' },
  pathPoint: { display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', fontWeight:'600', color:'#0f172a', padding:'4px 0' },
  pathDotGreen: { width:'12px', height:'12px', borderRadius:'50%', background:'#22c55e', flexShrink:0 },
  pathDotRed: { width:'12px', height:'12px', borderRadius:'50%', background:'#ef4444', flexShrink:0 },
  pathLine: { borderLeft:'2px dashed #cbd5e1', marginLeft:'5px', paddingLeft:'18px' },
  pathStop: { fontSize:'12px', color:'#64748b', padding:'2px 0' },
  resultMeta: { display:'flex', flexWrap:'wrap', gap:'8px' },
  metaChip: { fontSize:'12px', background:'#f8fafc', color:'#475569', padding:'4px 12px', borderRadius:'99px', border:'1px solid #e2e8f0' },
  metaChipBlue: { background:'#dbeafe', color:'#1e40af', border:'1px solid #bfdbfe' },
  liveInfo: { marginTop:'10px', background:'#f0fdf4', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'#166534', border:'1px solid #bbf7d0' },

  // All routes
  allRoutesWrap: { },
  allRoutesTitle: { fontSize:'14px', fontWeight:'700', color:'#0f172a', marginBottom:'12px' },
  allRoutesList: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' },
  allRouteItem: { background:'#fff', borderRadius:'12px', padding:'14px', border:'1px solid #e2e8f0', cursor:'pointer', transition:'border-color .15s' },
  ariRouteNum: { fontSize:'13px', fontWeight:'800', color:'#1e40af', marginBottom:'4px' },
  ariRoutePath: { fontSize:'12px', color:'#334155', marginBottom:'8px' },
  ariMeta: { fontSize:'11px', color:'#94a3b8', display:'flex', alignItems:'center', gap:'8px' },
  ariLive: { color:'#16a34a', fontWeight:'700' },

  // Timetable
  ttCard: { background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  ttTitle: { fontSize:'15px', fontWeight:'700', color:'#0f172a', marginBottom:'6px' },
  ttDesc: { fontSize:'13px', color:'#64748b', marginBottom:'16px' },
  ttSelect: { width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1.5px solid #e2e8f0', fontSize:'14px', outline:'none', color:'#0f172a', marginBottom:'0' },
  ttBody: { marginTop:'20px' },
  ttRouteInfo: { display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap' },
  ttRouteNum: { background:'#dbeafe', color:'#1e40af', fontSize:'13px', fontWeight:'700', padding:'5px 14px', borderRadius:'99px' },
  ttRoutePath: { fontSize:'13px', color:'#334155', fontWeight:'500' },
  ttNoData: { textAlign:'center', color:'#94a3b8', fontSize:'13px', padding:'24px' },
  ttGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'8px', marginBottom:'20px' },
  ttTime: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'10px', textAlign:'center', position:'relative' },
  ttTimePast: { background:'#f1f5f9', opacity:0.5 },
  ttTimeNext: { background:'#1d4ed8', border:'1px solid #1d4ed8', boxShadow:'0 0 0 3px rgba(29,78,216,0.2)' },
  ttNextLabel: { fontSize:'9px', fontWeight:'800', color:'#93c5fd', marginBottom:'2px' },
  ttTimeVal: { fontSize:'15px', fontWeight:'700', color:'inherit' },
  ttPastLabel: { fontSize:'9px', color:'#94a3b8', marginTop:'2px' },
  ttStops: { background:'#f8fafc', borderRadius:'12px', padding:'14px' },
  ttStopsTitle: { fontSize:'12px', fontWeight:'700', color:'#334155', marginBottom:'10px' },
  ttStopItem: { display:'flex', alignItems:'center', gap:'10px', padding:'6px 0', borderBottom:'1px solid #e2e8f0' },
  ttStopNum: { width:'22px', height:'22px', borderRadius:'50%', background:'#dbeafe', color:'#1e40af', fontSize:'10px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  ttStopName: { fontSize:'13px', color:'#334155' },

  // Live
  liveCard: { background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #e2e8f0', marginBottom:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  liveTitle: { fontSize:'15px', fontWeight:'700', color:'#0f172a', marginBottom:'6px' },
  liveDesc: { fontSize:'13px', color:'#64748b', marginBottom:'16px' },
  noLive: { textAlign:'center', padding:'48px', background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0' },
  liveBusList: { display:'flex', flexDirection:'column', gap:'14px' },
  liveBusCard: { background:'#fff', borderRadius:'16px', padding:'18px', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  lbcHeader: { display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' },
  lbcIconWrap: { width:'44px', height:'44px', background:'#dbeafe', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 },
  lbcNum: { fontSize:'16px', fontWeight:'700', color:'#0f172a', marginBottom:'2px' },
  lbcRoute: { fontSize:'12px', color:'#64748b' },
  lbcStatus: { fontSize:'12px', color:'#16a34a', fontWeight:'700', background:'#dcfce7', padding:'5px 12px', borderRadius:'99px', whiteSpace:'nowrap' },
  lbcGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'12px' },
  lbcItem: { background:'#f8fafc', borderRadius:'10px', padding:'10px' },
  lbcLabel: { fontSize:'9px', color:'#94a3b8', fontWeight:'700', letterSpacing:'.06em', marginBottom:'4px' },
  lbcVal: { fontSize:'14px', fontWeight:'700', color:'#0f172a' },
  lbcStopsRow: { display:'flex', flexWrap:'wrap', gap:'6px' },
  lbcStop: { fontSize:'11px', background:'#dbeafe', color:'#1e40af', padding:'3px 10px', borderRadius:'99px' },
};
