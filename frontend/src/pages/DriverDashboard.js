import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function DriverDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // Driver States
  const [isOnTrip, setIsOnTrip]         = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes]             = useState([]);
  const [timetables, setTimetables]     = useState([]);
  
  // Dummy Telemetry Data for Drivers
  const [speed, setSpeed]               = useState(0);
  const [location, setLocation]         = useState({ lat: '6.9271', lng: '79.8612' });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Fetch Routes
    axios.get(`${API}/api/routes`)
      .then(r => setRoutes(Array.isArray(r.data) ? r.data : (r.data?.routes || [])))
      .catch(() => setRoutes([]));

    // Fetch Schedules
    axios.get(`${API}/api/timetables`)
      .then(r => setTimetables(Array.isArray(r.data) ? r.data : (r.data?.timetables || [])))
      .catch(() => setTimetables([]));
  }, []);

  const safeRoutes     = Array.isArray(routes) ? routes : [];
  const safeTimetables = Array.isArray(timetables) ? timetables : [];

  // Logout Handler
  const handleLogout = () => {
    try {
      if (logout) logout();
      localStorage.clear(); // Clear all saved auth data
      navigate('/login');   // Navigate to login screen
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Toggle Live Trip Handler
  const toggleTripStatus = async () => {
    try {
      const nextStatus = !isOnTrip;
      setIsOnTrip(nextStatus);

      if (nextStatus) {
        setSpeed(42);
      } else {
        setSpeed(0);
      }

      await axios.patch(`${API}/api/buses/status`, {
        driverId: user?._id,
        status: nextStatus ? 'on-trip' : 'inactive',
        routeNumber: selectedRoute
      }, { headers }).catch(err => console.log('Status sync simulated', err));

    } catch (err) {
      console.error('Trip toggle error:', err);
    }
  };

  return (
    <div style={S.page}>

      {/* Navigation Header */}
      <div style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navLogoIcon}>🧭</div>
          <div>
            <div style={S.navBrand}>Driver Console</div>
            <div style={S.navTag}>Driver: {user?.name || 'Bus Driver'}</div>
          </div>
        </div>
        <div style={S.navRight}>
          <Link to="/tracking" style={S.navBtn}>
            <span style={S.liveDot} />
            🗺️ View Live Map
          </Link>
          
          {/* Slices Logout Action */}
          <button onClick={handleLogout} style={S.navLogoutBtn}>
            ⏻ Logout
          </button>
        </div>
      </div>

      {/* Stats & Quick Actions Overview */}
      <div style={S.statsRow}>
        <div style={{...S.statCard, borderLeftColor: isOnTrip ? '#10b981' : '#ef4444'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={isOnTrip ? S.liveDot : S.offlineDot} />
            <div style={S.statNum}>{isOnTrip ? 'ON TRIP' : 'OFF DUTY'}</div>
          </div>
          <div style={S.statLabel}>Current Trip Status</div>
        </div>
        
        <div style={{...S.statCard, borderLeftColor: '#2563eb'}}>
          <div style={S.statNum}>{speed} <span style={{ fontSize: '14px', color: '#64748b' }}>km/h</span></div>
          <div style={S.statLabel}>Current Speed</div>
        </div>

        <div style={{...S.statCard, borderLeftColor: '#0ea5e9'}}>
          <div style={S.statNum}>{selectedRoute || 'None'}</div>
          <div style={S.statLabel}>Assigned Route</div>
        </div>

        <div style={{...S.statCard, borderLeftColor: '#f59e0b'}}>
          <div style={S.statNum}>GPS Active</div>
          <div style={S.statLabel}>Lat: {location.lat} | Lng: {location.lng}</div>
        </div>
      </div>

      <div style={S.content}>

        {/* LIVE CONTROL PANEL CARD */}
        <div style={S.formCard}>
          <div style={S.formTitle}>⚡ Live Trip Broadcast Controller</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Select Route:</label>
              <select 
                style={S.input} 
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
                disabled={isOnTrip}
              >
                <option value="">-- Choose Assigned Route --</option>
                {safeRoutes.map(r => (
                  <option key={r._id} value={r.routeNumber}>
                    Route {r.routeNumber} ({r.origin} → {r.destination})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
              <button 
                onClick={toggleTripStatus} 
                style={isOnTrip ? S.endTripBtn : S.startTripBtn}
              >
                {isOnTrip ? '🔴 END LIVE TRIP' : '🟢 START LIVE BROADCAST'}
              </button>
              
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                {isOnTrip 
                  ? '📡 Live location is currently broadcasting to passengers.' 
                  : '⚠️ Click to start sharing location on the public live map.'}
              </span>
            </div>

          </div>
        </div>

        {/* TODAY'S SCHEDULE TABLE */}
        <div style={S.tableCard}>
          <div style={S.tableHeader}>
            📋 Scheduled Bus Timetable ({safeTimetables.length})
          </div>
          {safeTimetables.map(t => (
            <div key={t._id} style={S.tableRow}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={S.routeBadge}>Route {t.routeNumber}</span>
                  <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>Bus: {t.busNumber}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>🛫 Departure: <b>{t.departureTime}</b></span>
                  <span>→</span>
                  <span>🛬 Expected Arrival: <b>{t.arrivalTime}</b></span>
                </div>
              </div>
              <span style={S.pillGray}>Scheduled</span>
            </div>
          ))}
          {safeTimetables.length === 0 && (
            <div style={S.empty}>No schedules assigned for today.</div>
          )}
        </div>

      </div>
    </div>
  );
}

// 🎨 Matching Premium Styling System
const S = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" },
  nav: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '12px' },
  navLogoIcon: { 
    width: '42px', 
    height: '42px', 
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
    color: '#2563eb', 
    border: '1px solid #bfdbfe',
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '20px',
    boxShadow: '0 2px 8px rgba(37,99,235,0.08)'
  },
  navBrand: { fontSize: '16px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
  navTag: { fontSize: '11px', color: '#64748b', fontWeight: '500' },
  navRight: { display: 'flex', gap: '10px' },
  navBtn: { 
    padding: '9px 18px', 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '12px', 
    fontWeight: '700', 
    cursor: 'pointer', 
    textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  liveDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#6ee7b7',
    borderRadius: '50%',
    boxShadow: '0 0 8px #34d399',
  },
  offlineDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#ef4444',
    borderRadius: '50%',
  },
  navLogoutBtn: { 
    padding: '9px 18px', 
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '12px', 
    fontWeight: '700', 
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
    letterSpacing: '0.01em'
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', padding: '24px 28px 0' },
  statCard: { 
    background: '#ffffff', 
    borderRadius: '14px', 
    padding: '18px 20px', 
    textAlign: 'left', 
    border: '1px solid #e2e8f0', 
    borderLeft: '5px solid #2563eb',
    boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.03)'
  },
  statNum: { fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' },
  content: { padding: '24px 28px' },
  formCard: { 
    background: '#ffffff', 
    borderRadius: '16px', 
    padding: '22px 24px', 
    border: '1px solid #e2e8f0', 
    marginBottom: '20px',
    boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.04)'
  },
  formTitle: { fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.01em' },
  input: { 
    padding: '10px 14px', 
    borderRadius: '10px', 
    border: '1px solid #cbd5e1', 
    fontSize: '12.5px', 
    minWidth: '260px',
    outline: 'none',
    background: '#ffffff'
  },
  startTripBtn: {
    padding: '12px 26px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
    letterSpacing: '0.02em'
  },
  endTripBtn: {
    padding: '12px 26px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.35)',
    letterSpacing: '0.02em'
  },
  tableCard: { 
    background: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden',
    boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.04)'
  },
  tableHeader: { padding: '14px 20px', background: '#f8fafc', fontSize: '12.5px', fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #e2e8f0' },
  tableRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' },
  routeBadge: {
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800'
  },
  pillGray: { fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' },
  empty: { padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: '500' }
};