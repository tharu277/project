import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// VAPID Public Key එක Backend එකේ .env එකේ තියෙන එකම විය යුතුය
const PUBLIC_VAPID_KEY = process.env.REACT_APP_PUBLIC_VAPID_KEY || 'YOUR_PUBLIC_VAPID_KEY_HERE';

// Helper: Base64 string to Uint8Array for Push Subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PassengerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [buses, setBuses] = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('schedules'); // 'schedules' | 'buses'
  const [showMap, setShowMap] = useState(true);

  // 🔔 Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifications, setNotifications] = useState([
   
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // ----------------------------------------------------
  // 🔔 1. Web Push Notification Registration Logic
  // ----------------------------------------------------
  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push Notifications are not supported by this browser.');
      return;
    }

    try {
      const register = await navigator.serviceWorker.ready;
      
      // Permission ඉල්ලා සිටීම
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission denied.');
        return;
      }

      // Subscription එකක් සාදාගැනීම
      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      // Backend API එකට Push Subscription එක Send කිරීම
      await axios.post(`${API}/api/notifications/subscribe`, subscription);
      setIsSubscribed(true);
      console.log('Successfully subscribed to Web Push Notifications!');
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
    }
  };

  // ----------------------------------------------------
  // 📲 2. Fetch Initial Dashboard & Live Active Buses Data
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [busesRes, activeBusesRes, routesRes, timetablesRes] = await Promise.all([
          axios.get(`${API}/api/buses`).catch(() => ({ data: [] })),
          axios.get(`${API}/api/active-buses`).catch(() => ({ data: { buses: [] } })), // Our upgraded endpoint
          axios.get(`${API}/api/routes`).catch(() => ({ data: [] })),
          axios.get(`${API}/api/timetables`).catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          const busesData = busesRes.data;
          const activeBusesData = activeBusesRes.data;
          const routesData = routesRes.data;
          const timetablesData = timetablesRes.data;

          setBuses(Array.isArray(busesData) ? busesData : busesData?.buses || []);
          setActiveBuses(activeBusesData?.buses || []);
          setRoutes(Array.isArray(routesData) ? routesData : routesData?.routes || []);
          setTimetables(Array.isArray(timetablesData) ? timetablesData : timetablesData?.timetables || []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch dashboard data. Please try refreshing.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    
    // Auto Push Notification Registration Attempt
    subscribeToPushNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const safeBuses = useMemo(() => (Array.isArray(buses) ? buses : []), [buses]);
  const safeRoutes = useMemo(() => (Array.isArray(routes) ? routes : []), [routes]);
  const safeTimetables = useMemo(() => (Array.isArray(timetables) ? timetables : []), [timetables]);

  // Search Filtering
  const filteredSchedules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return safeTimetables;

    return safeTimetables.filter(
      (t) =>
        t.busNumber?.toLowerCase().includes(term) ||
        t.routeNumber?.toLowerCase().includes(term)
    );
  }, [safeTimetables, searchTerm]);

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    }
    navigate('/login');
  };

  return (
    <div style={S.page}>
      {/* Navigation Header */}
      <div style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navLogoIcon}>📍</div>
          <div>
            <div style={S.navBrand}>Passenger Portal</div>
            <div style={S.navTag}>Welcome, {user?.name || 'Commuter'}</div>
          </div>
        </div>

        <div style={S.navRight}>
          {/* Push Subscribed Indicator */}
          {isSubscribed && (
            <span style={S.subscribedBadge} title="Push Notifications Active">
              🟢 Push Enabled
            </span>
          )}

          {/* 🔔 Notification Button & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              style={S.notifBtn} 
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={S.notifBadge}>{unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div style={S.notifPanel}>
                <div style={S.notifHeader}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Notifications</strong>
                  {unreadCount > 0 && (
                    <button style={S.markReadBtn} onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div style={S.notifList}>
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      style={{
                        ...S.notifItem,
                        backgroundColor: n.read ? '#ffffff' : '#f0f9ff'
                      }}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div style={S.notifItemHeader}>
                        <span style={S.notifItemTitle}>{n.title}</span>
                        <span style={S.notifTime}>{n.time}</span>
                      </div>
                      <div style={S.notifMessage}>{n.message}</div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div style={S.emptyNotif}>No notifications right now.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/tracking" style={S.navBtn}>
            <span style={S.liveDot} />
            🗺️ View Live Map
          </Link>
          
          <button onClick={handleLogout} style={S.navLogoutBtn}>
            ⏻ Logout
          </button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statNum}>
            {/* Live Socket/RAM map එකේ තියෙන බස් ගණන */}
            {activeBuses.length > 0 ? activeBuses.length : safeBuses.filter((b) => b.status === 'on-trip' || b.status === 'active').length}
          </div>
          <div style={S.statLabel}>Buses Currently Live</div>
        </div>
        <div style={{ ...S.statCard, borderLeftColor: '#10b981' }}>
          <div style={S.statNum}>{safeRoutes.length}</div>
          <div style={S.statLabel}>Available Routes</div>
        </div>
        <div style={{ ...S.statCard, borderLeftColor: '#0ea5e9' }}>
          <div style={S.statNum}>{safeTimetables.length}</div>
          <div style={S.statLabel}>Total Daily Trips</div>
        </div>
        <div style={{ ...S.statCard, borderLeftColor: '#f59e0b' }}>
          <div style={S.statNum}>ON TIME</div>
          <div style={S.statLabel}>System Status</div>
        </div>
      </div>

      {/* Live Map Preview Banner */}
      {showMap && (
        <div style={S.mapBannerCard}>
          <div style={S.mapBannerHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={S.liveDot} />
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>Real-Time Fleet Tracking</strong>
            </div>
            <button style={S.toggleMapBtn} onClick={() => setShowMap(false)}>
              ✕ Hide Map
            </button>
          </div>
          <div style={S.mapPlaceholder}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '32px' }}>🗺️</span>
              <p style={{ margin: '8px 0 12px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                Track active buses live on the interactive map
              </p>
              <Link to="/tracking" style={S.launchMapBtn}>
                🚀 Open Full Interactive Map
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={S.tabs}>
        <button
          style={activeTab === 'schedules' ? S.tabAct : S.tab}
          onClick={() => setActiveTab('schedules')}
        >
          ⏰ Bus Schedules & Timetable
        </button>
        <button
          style={activeTab === 'buses' ? S.tabAct : S.tab}
          onClick={() => setActiveTab('buses')}
        >
          🚌 Registered Buses ({safeBuses.length})
        </button>
      </div>

      <div style={S.content}>
        {loading ? (
          <div style={S.empty}>⏳ Loading data, please wait...</div>
        ) : error ? (
          <div style={{ ...S.empty, color: '#ef4444' }}>{error}</div>
        ) : (
          <>
            {/* SCHEDULES & SEARCH TAB */}
            {activeTab === 'schedules' && (
              <>
                <div style={S.formCard}>
                  <div style={S.formTitle}>🔍 Search Schedules & Bus Routes</div>
                  <div style={S.formRow}>
                    <input
                      style={S.input}
                      placeholder="Enter Route No. (e.g. 138) or Bus No. (e.g. NB-1234)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button style={S.clearBtn} onClick={() => setSearchTerm('')}>
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>

                <div style={S.tableCard}>
                  <div style={S.tableHeader}>
                    📋 Upcoming Departure Schedules ({filteredSchedules.length})
                  </div>
                  {filteredSchedules.map((t) => (
                    <div key={t._id || t.id} style={S.tableRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={S.routeBadge}>Route {t.routeNumber}</span>
                          <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                            Bus: {t.busNumber}
                          </strong>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            marginTop: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span>
                            🛫 Departure: <b style={{ color: '#2563eb' }}>{t.departureTime}</b>
                          </span>
                          <span>→</span>
                          <span>
                            🛬 Expected Arrival:{' '}
                            <b style={{ color: '#059669' }}>{t.arrivalTime}</b>
                          </span>
                        </div>
                      </div>
                      <Link to="/tracking" style={S.trackBtn}>
                        📍 Track Bus
                      </Link>
                    </div>
                  ))}
                  {filteredSchedules.length === 0 && (
                    <div style={S.empty}>No bus schedules found matching your search.</div>
                  )}
                </div>
              </>
            )}

            {/* ACTIVE BUSES LIST TAB */}
            {activeTab === 'buses' && (
              <div style={S.tableCard}>
                <div style={S.tableHeader}>🚌 All Registered Buses & Live Status</div>
                {safeBuses.map((b) => {
                  const isLive = activeBuses.some(ab => ab.busId === b.busNumber || ab.busId === b._id) || b.status === 'on-trip' || b.status === 'active';
                  
                  return (
                    <div key={b._id || b.id} style={S.tableRow}>
                      <div style={{ flex: 1 }}>
                        <span style={S.rowMain}>{b.busNumber}</span>
                      </div>
                      <span style={isLive ? S.pillGreen : S.pillGray}>
                        {isLive ? '🟢 Live On-Road' : '⚪ Inactive'}
                      </span>
                      <Link to="/tracking" style={S.trackBtn}>
                        🗺️ View Location
                      </Link>
                    </div>
                  );
                })}
                {safeBuses.length === 0 && (
                  <div style={S.empty}>No active buses registered right now.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" },
  nav: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '12px' },
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
  navRight: { display: 'flex', gap: '12px', alignItems: 'center' },
  
  subscribedBadge: {
    fontSize: '11px',
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '600'
  },

  // 🔔 Notification Button & Panel Styles
  notifBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: '16px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '800',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
  },
  notifPanel: {
    position: 'absolute',
    top: '48px',
    right: '0',
    width: '300px',
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    overflow: 'hidden'
  },
  notifHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  markReadBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  notifList: {
    maxHeight: '280px',
    overflowY: 'auto'
  },
  notifItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
  notifItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  notifItemTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a'
  },
  notifTime: {
    fontSize: '10px',
    color: '#94a3b8'
  },
  notifMessage: {
    fontSize: '11.5px',
    color: '#475569',
    lineHeight: '1.4'
  },
  emptyNotif: {
    padding: '16px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8'
  },

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
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '24px 28px 0' },
  statCard: { 
    background: '#ffffff', 
    borderRadius: '14px', 
    padding: '18px 20px', 
    textAlign: 'left', 
    border: '1px solid #e2e8f0', 
    borderLeft: '5px solid #2563eb',
    boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.03)'
  },
  statNum: { fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' },
  mapBannerCard: {
    margin: '20px 28px 0',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.04)'
  },
  mapBannerHeader: {
    padding: '12px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center'
  },
  toggleMapBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  mapPlaceholder: {
    padding: '30px 20px',
    background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
    display: 'flex',
    justify: 'center',
    alignItems: 'center'
  },
  launchMapBtn: {
    padding: '9px 20px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-block',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)'
  },
  tabs: { display: 'flex', gap: '10px', padding: '20px 28px 0', flexWrap: 'wrap' },
  tab: { 
    padding: '10px 20px', 
    border: '1px solid #e2e8f0', 
    background: '#ffffff', 
    borderRadius: '10px', 
    fontSize: '12.5px', 
    color: '#64748b', 
    cursor: 'pointer', 
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  tabAct: { 
    padding: '10px 20px', 
    border: 'none', 
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
    borderRadius: '10px', 
    fontSize: '12.5px', 
    color: '#ffffff', 
    cursor: 'pointer', 
    fontWeight: '700',
    boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
  },
  content: { padding: '20px 28px' },
  formCard: { 
    background: '#ffffff', 
    borderRadius: '16px', 
    padding: '20px 22px', 
    border: '1px solid #e2e8f0', 
    marginBottom: '20px',
    boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.04)'
  },
  formTitle: { fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.01em' },
  formRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { 
    padding: '10px 14px', 
    borderRadius: '10px', 
    border: '1px solid #cbd5e1', 
    fontSize: '12.5px', 
    flex: 1, 
    minWidth: '200px',
    outline: 'none'
  },
  clearBtn: {
    padding: '10px 18px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tableCard: { 
    background: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden',
    boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.04)'
  },
  tableHeader: { padding: '14px 20px', background: '#f8fafc', fontSize: '12.5px', fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #e2e8f0' },
  tableRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' },
  rowMain: { flex: 1, fontSize: '13.5px', fontWeight: '600', color: '#0f172a' },
  routeBadge: {
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800'
  },
  trackBtn: {
    padding: '7px 14px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '11.5px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(37,99,235,0.2)'
  },
  pillGreen: { fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '99px', fontWeight: '700' },
  pillGray: { fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' },
  empty: { padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: '500' }
};