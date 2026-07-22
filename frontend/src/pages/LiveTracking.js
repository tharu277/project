import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';

// 🟢 Premium Custom Map Marker Icons
const liveBusIcon = new L.DivIcon({
  className: 'custom-live-icon',
  html: `<div style="
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    border: 3px solid white;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6);
  ">🚌</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const inactiveBusIcon = new L.DivIcon({
  className: 'custom-inactive-icon',
  html: `<div style="
    background: #64748b;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  ">🚌</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Helper component to auto-pan map to selected bus
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function LiveTracking() {
  const navigate = useNavigate();
  const [buses, setBuses]               = useState([]);
  const [selectedBus, setSelectedBus]   = useState(null);
  const [filter, setFilter]             = useState('all'); // 'all' | 'live'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default Map Center (Colombo, Sri Lanka)
  const defaultCenter = [6.9271, 79.8612];
  const [mapCenter, setMapCenter]     = useState(defaultCenter);

  useEffect(() => {
    const fetchLiveBuses = () => {
      axios.get(`${API}/api/buses`)
        .then(r => {
          const busData = Array.isArray(r.data) ? r.data : (r.data?.buses || []);
          const formattedBuses = busData.map((b, idx) => ({
            ...b,
            lat: b.location?.lat || 6.9271 + (idx * 0.012),
            lng: b.location?.lng || 79.8612 + (idx * 0.008)
          }));
          setBuses(formattedBuses);
        })
        .catch(() => setBuses([]));
    };

    fetchLiveBuses();
    const interval = setInterval(fetchLiveBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredBuses = buses.filter(b => {
    if (filter === 'live') return b.status === 'on-trip' || b.status === 'active';
    return true;
  });

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setMapCenter([bus.lat, bus.lng]);
  };

  return (
    <div style={S.page}>

      

      {/* Matching Premium Header */}
      {!isFullscreen && (
        <div style={S.nav}>
          <div style={S.navLogo}>
            <div style={S.navLogoIcon}>🗺️</div>
            <div>
              <div style={S.navBrand}>Live Fleet Tracking</div>
              <div style={S.navTag}>Interactive Map surveillance System</div>
            </div>
          </div>

          {/* Back Buttons & Actions */}
          <div style={S.navRight}>
            <button 
              onClick={() => setIsFullscreen(true)} 
              style={S.focusBtn}
            >
              📺 Fullscreen Focus
            </button>
            
            {/* ⬅ Premium Back Button to Dashboard */}
            <button onClick={() => navigate(-1)} style={S.backBtn}>
              ⬅ Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div style={isFullscreen ? S.fullContainer : S.container}>
        
        {/* Left Control & Bus List Panel */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                🚌 Active Buses ({filteredBuses.length})
              </span>
              <span style={S.liveBadge}>
                <span style={S.liveDot} /> LIVE
              </span>
            </div>

            {/* Filter Toggle */}
            <div style={S.filterBox}>
              <button 
                style={filter === 'all' ? S.filterAct : S.filterBtn}
                onClick={() => setFilter('all')}
              >
                All Vehicles
              </button>
              <button 
                style={filter === 'live' ? S.filterAct : S.filterBtn}
                onClick={() => setFilter('live')}
              >
                🟢 On-Road Only
              </button>
            </div>
          </div>

          {/* Interactive Bus Cards */}
          <div style={S.busList}>
            {filteredBuses.map(b => {
              const isLive = b.status === 'on-trip' || b.status === 'active';
              const isSelected = selectedBus?._id === b._id;

              return (
                <div 
                  key={b._id} 
                  style={isSelected ? S.busCardSelected : S.busCard}
                  onClick={() => handleSelectBus(b)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{b.busNumber}</strong>
                      {b.routeNumber && (
                        <span style={S.routeBadge}>Route {b.routeNumber}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                      Driver: <b>{b.driverName || 'Assigned Driver'}</b>
                    </div>
                  </div>

                  <span style={isLive ? S.pillGreen : S.pillGray}>
                    {isLive ? '🟢 Live' : '⚪ Idle'}
                  </span>
                </div>
              );
            })}

            {filteredBuses.length === 0 && (
              <div style={S.empty}>No active buses currently transmitting location.</div>
            )}
          </div>

          {/* Quick Dashboard Return Link inside Sidebar */}
          <div style={S.sidebarFooter}>
            <button onClick={() => navigate(-1)} style={S.sidebarBackBtn}>
              ⬅ Return to Main Dashboard
            </button>
          </div>

          {isFullscreen && (
            <button 
              onClick={() => setIsFullscreen(false)} 
              style={S.exitFullscreenBtn}
            >
              ✕ Exit Fullscreen Mode
            </button>
          )}
        </div>

        {/* Right Interactive Leaflet Map Container */}
        <div style={S.mapWrapper}>
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapRecenter center={mapCenter} />

            {filteredBuses.map(b => {
              const isLive = b.status === 'on-trip' || b.status === 'active';

              return (
                <Marker 
                  key={b._id} 
                  position={[b.lat, b.lng]}
                  icon={isLive ? liveBusIcon : inactiveBusIcon}
                  eventHandlers={{
                    click: () => setSelectedBus(b)
                  }}
                >
                  <Popup>
                    <div style={S.popupCard}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                        🚌 {b.busNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700', marginTop: '2px' }}>
                        Route: {b.routeNumber || 'Standard'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                        Status: <b style={{ color: isLive ? '#10b981' : '#64748b' }}>{isLive ? 'Live On-Road' : 'Inactive'}</b>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Speed: <b>{isLive ? '42 km/h' : '0 km/h'}</b>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}

// 🎨 Premium Design System Styles
const S = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", overflow: 'hidden' },
  explainBar: { display: 'flex', gap: '10px', alignItems: 'center', background: 'linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%)', borderBottom: '1px solid #dbeafe', padding: '9px 24px', fontSize: '12px', color: '#1e40af' },
  explainIcon: { fontSize: '15px' },
  explainText: { lineHeight: 1.5, letterSpacing: '0.03em' },
  
  nav: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
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
  navRight: { display: 'flex', gap: '10px', alignItems: 'center' },

  focusBtn: {
    padding: '9px 16px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  // 💎 Premium Return / Back Button
  backBtn: {
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },

  container: { flex: 1, display: 'flex', overflow: 'hidden' },
  fullContainer: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', background: '#ffffff' },

  sidebar: { width: '350px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '4px 0 15px rgba(0,0,0,0.02)' },
  sidebarHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' },
  
  liveBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' },
  liveDot: { width: '7px', height: '7px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' },

  filterBox: { display: 'flex', gap: '6px' },
  filterBtn: { flex: 1, padding: '7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
  filterAct: { flex: 1, padding: '7px', background: '#2563eb', border: '1px solid #2563eb', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' },

  busList: { flex: 1, overflowY: 'auto', padding: '14px' },
  busCard: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s ease', background: '#ffffff' },
  busCardSelected: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', border: '1px solid #2563eb', marginBottom: '10px', cursor: 'pointer', background: '#eff6ff', boxShadow: '0 4px 12px rgba(37,99,235,0.12)' },

  routeBadge: { background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800' },
  pillGreen: { fontSize: '10.5px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '99px', fontWeight: '700' },
  pillGray: { fontSize: '10.5px', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' },

  sidebarFooter: { padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
  sidebarBackBtn: { width: '100%', padding: '10px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },

  exitFullscreenBtn: { padding: '12px', background: '#ef4444', color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },

  mapWrapper: { flex: 1, height: '100%', position: 'relative' },
  popupCard: { padding: '4px 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" },

  empty: { padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '500' }
};