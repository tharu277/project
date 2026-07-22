import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // 🟢 useNavigate එක Import කරන ලදී

const API = 'http://localhost:5000';

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate(); // 🟢 Navigation සක්‍රිය කිරීම

  const [tab, setTab] = useState('buses');
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [timetables, setTimetables] = useState([]);

  // Form States
  const [busForm, setBusForm] = useState({ busNumber: '', status: 'inactive' });
  const [routeForm, setRouteForm] = useState({ routeNumber: '', origin: '', destination: '', totalDistance: '', estimatedTime: '' });
  
  // Timetable Form State
  const [timetableForm, setTimetableForm] = useState({
    busNumber: '',
    routeNumber: '',
    stops: [{ stopName: '', arrivalTime: '' }]
  });

  const headers = { Authorization: `Bearer ${token}` };

  // 🟢 Logout Handler Function එක
  const handleLogout = () => {
    try {
      if (logout) {
        logout(); // Context එක හරහා state clean කරයි
      }
      localStorage.clear(); // Safety එක සඳහා Local Storage clear කරයි
      navigate('/login');   // Login Page එකට Redirect කරයි
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  useEffect(() => {
    // Fetch Buses
    axios.get(`${API}/api/buses`)
      .then(r => setBuses(Array.isArray(r.data) ? r.data : (r.data?.buses || [])))
      .catch(() => setBuses([]));

    // Fetch Routes
    axios.get(`${API}/api/routes`)
      .then(r => setRoutes(Array.isArray(r.data) ? r.data : (r.data?.routes || [])))
      .catch(() => setRoutes([]));

    // Fetch Timetables
    axios.get(`${API}/api/timetables`)
      .then(r => setTimetables(Array.isArray(r.data) ? r.data : (r.data?.timetables || [])))
      .catch(() => setTimetables([]));
  }, []);

  // Safe Arrays
  const safeBuses = Array.isArray(buses) ? buses : [];
  const safeRoutes = Array.isArray(routes) ? routes : [];
  const safeTimetables = Array.isArray(timetables) ? timetables : [];

  // Handlers for Buses & Routes
  const addBus = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/api/buses`, busForm, { headers });
      setBuses([...safeBuses, data]);
      setBusForm({ busNumber: '', status: 'inactive' });
    } catch (err) { console.error(err); }
  };

  const deleteBus = async id => {
    try {
      await axios.delete(`${API}/api/buses/${id}`, { headers });
      setBuses(safeBuses.filter(b => b._id !== id));
    } catch (err) { console.error(err); }
  };

  const addRoute = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/api/routes`, routeForm, { headers });
      setRoutes([...safeRoutes, data]);
      setRouteForm({ routeNumber: '', origin: '', destination: '', totalDistance: '', estimatedTime: '' });
    } catch (err) { console.error(err); }
  };

  const deleteRoute = async id => {
    try {
      await axios.delete(`${API}/api/routes/${id}`, { headers });
      setRoutes(safeRoutes.filter(r => r._id !== id));
    } catch (err) { console.error(err); }
  };

  // Dynamic Stop Handlers for Timetable Form
  const handleAddStopField = () => {
    setTimetableForm({
      ...timetableForm,
      stops: [...timetableForm.stops, { stopName: '', arrivalTime: '' }]
    });
  };

  const handleRemoveStopField = (index) => {
    const updatedStops = timetableForm.stops.filter((_, i) => i !== index);
    setTimetableForm({ ...timetableForm, stops: updatedStops });
  };

  const handleStopChange = (index, field, value) => {
    const updatedStops = [...timetableForm.stops];
    updatedStops[index][field] = value;
    setTimetableForm({ ...timetableForm, stops: updatedStops });
  };

  // Add Timetable
  const addTimetable = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/api/timetables`, timetableForm, { headers });
      setTimetables([...safeTimetables, data]);
      setTimetableForm({
        busNumber: '',
        routeNumber: '',
        stops: [{ stopName: '', arrivalTime: '' }]
      });
    } catch (err) { console.error(err); }
  };

  const deleteTimetable = async id => {
    try {
      await axios.delete(`${API}/api/timetables/${id}`, { headers });
      setTimetables(safeTimetables.filter(t => t._id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={S.page}>

      {/* Navbar */}
      <div style={S.nav}>
        <div style={S.navLogo}>
          <div style={S.navLogoIcon}>🛡️</div>
          <div>
            <div style={S.navBrand}>Admin Dashboard</div>
            <div style={S.navTag}>Admin: {user?.name || 'Administrator'}</div>
          </div>
        </div>
        <div style={S.navRight}>
          <Link to="/tracking" style={S.navBtn}>
            <span style={S.liveDot} />
            🗺️ View Live Map
          </Link>
          {/* 🟢 Logout Button එක handleLogout Function එකට සම්බන්ධ කර ඇත */}
          <button onClick={handleLogout} style={S.navLogoutBtn}>⏻ Logout</button>
        </div>
      </div>

      {/* Stats Section */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statNum}>{safeBuses.length}</div>
          <div style={S.statLabel}>Total Buses</div>
        </div>
        <div style={{...S.statCard, borderLeftColor: '#10b981'}}>
          <div style={S.statNum}>{safeBuses.filter(b => b.status === 'on-trip' || b.status === 'active').length}</div>
          <div style={S.statLabel}>Active Buses</div>
        </div>
        <div style={{...S.statCard, borderLeftColor: '#0ea5e9'}}>
          <div style={S.statNum}>{safeRoutes.length}</div>
          <div style={S.statLabel}>Routes</div>
        </div>
        <div style={{...S.statCard, borderLeftColor: '#f59e0b'}}>
          <div style={S.statNum}>{safeTimetables.length}</div>
          <div style={S.statLabel}>Schedules</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={S.tabs}>
        <button style={tab === 'buses' ? S.tabAct : S.tab} onClick={() => setTab('buses')}>🚌 Manage Buses</button>
        <button style={tab === 'routes' ? S.tabAct : S.tab} onClick={() => setTab('routes')}>🗺️ Manage Routes</button>
        <button style={tab === 'timetable' ? S.tabAct : S.tab} onClick={() => setTab('timetable')}>⏰ Bus Time Table</button>
      </div>

      <div style={S.content}>

        {/* BUSES TAB */}
        {tab === 'buses' && (
          <>
            <div style={S.formCard}>
              <div style={S.formTitle}>➕ Add New Bus</div>
              <form onSubmit={addBus} style={S.formRow}>
                <input 
                  style={S.input} 
                  placeholder="Bus Number (e.g. NB-1234)" 
                  value={busForm.busNumber}
                  onChange={e => setBusForm({ ...busForm, busNumber: e.target.value })} 
                  required 
                />
                <select 
                  style={S.input} 
                  value={busForm.status} 
                  onChange={e => setBusForm({ ...busForm, status: e.target.value })}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
                <button style={S.addBtn} type="submit">+ Add Bus</button>
              </form>
            </div>

            <div style={S.tableCard}>
              <div style={S.tableHeader}>📋 All Buses List ({safeBuses.length})</div>
              {safeBuses.map(b => (
                <div key={b._id} style={S.tableRow}>
                  <span style={S.rowMain}>{b.busNumber}</span>
                  <span style={b.status === 'on-trip' || b.status === 'active' ? S.pillGreen : S.pillGray}>{b.status}</span>
                  <button style={S.delBtn} onClick={() => deleteBus(b._id)}>🗑️ Delete</button>
                </div>
              ))}
              {safeBuses.length === 0 && <div style={S.empty}>No Available buses — Add Buses form</div>}
            </div>
          </>
        )}

        {/* ROUTES TAB */}
        {tab === 'routes' && (
          <>
            <div style={S.formCard}>
              <div style={S.formTitle}>➕ Add New Route</div>
              <form onSubmit={addRoute} style={S.formRow}>
                <input 
                  style={S.input} 
                  placeholder="Route No. (138)" 
                  value={routeForm.routeNumber}
                  onChange={e => setRouteForm({ ...routeForm, routeNumber: e.target.value })} 
                  required 
                />
                <input 
                  style={S.input} 
                  placeholder="Origin (Pannipitiya)" 
                  value={routeForm.origin}
                  onChange={e => setRouteForm({ ...routeForm, origin: e.target.value })} 
                  required 
                />
                <input 
                  style={S.input} 
                  placeholder="Destination (Fort)" 
                  value={routeForm.destination}
                  onChange={e => setRouteForm({ ...routeForm, destination: e.target.value })} 
                  required 
                />
                <button style={S.addBtn} type="submit">+ Add Route</button>
              </form>
            </div>

            <div style={S.tableCard}>
              <div style={S.tableHeader}>📋 All Routes List ({safeRoutes.length})</div>
              {safeRoutes.map(r => (
                <div key={r._id} style={S.tableRow}>
                  <span style={S.rowMain}>Route {r.routeNumber}: {r.origin} → {r.destination}</span>
                  <button style={S.delBtn} onClick={() => deleteRoute(r._id)}>🗑️ Delete</button>
                </div>
              ))}
              {safeRoutes.length === 0 && <div style={S.empty}>No Available Routes — Add routes</div>}
            </div>
          </>
        )}

        {/* TIME TABLE TAB */}
        {tab === 'timetable' && (
          <>
            <div style={S.formCard}>
              <div style={S.formTitle}>➕ Add Bus Schedule & Stop Arrival Times</div>
              <form onSubmit={addTimetable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={S.formRow}>
                  <input 
                    style={S.input} 
                    placeholder="Bus No. (e.g. NB-1234)" 
                    value={timetableForm.busNumber}
                    onChange={e => setTimetableForm({ ...timetableForm, busNumber: e.target.value })} 
                    required 
                  />
                  <input 
                    style={S.input} 
                    placeholder="Route No. (e.g. 138)" 
                    value={timetableForm.routeNumber}
                    onChange={e => setTimetableForm({ ...timetableForm, routeNumber: e.target.value })} 
                    required 
                  />
                </div>

                <div style={S.subHeading}>🚏 Bus Stops & Arrival Times</div>

                {timetableForm.stops.map((stop, index) => (
                  <div key={index} style={S.stopRow}>
                    <input 
                      style={{ ...S.input, flex: 2 }} 
                      placeholder={`Stop ${index + 1} Name (e.g. Maharagama Stand)`}
                      value={stop.stopName}
                      onChange={e => handleStopChange(index, 'stopName', e.target.value)}
                      required 
                    />
                    <input 
                      type="time"
                      style={{ ...S.input, flex: 1 }} 
                      title="Estimated Arrival Time"
                      value={stop.arrivalTime}
                      onChange={e => handleStopChange(index, 'arrivalTime', e.target.value)}
                      required 
                    />
                    {timetableForm.stops.length > 1 && (
                      <button 
                        type="button" 
                        style={S.removeStopBtn}
                        onClick={() => handleRemoveStopField(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    style={S.secondaryBtn} 
                    onClick={handleAddStopField}
                  >
                    + Add Bus Stop
                  </button>
                  <button style={S.addBtn} type="submit">+ Save Timetable</button>
                </div>
              </form>
            </div>

            <div style={S.tableCard}>
              <div style={S.tableHeader}>📋 Active Time Tables ({safeTimetables.length})</div>
              {safeTimetables.map(t => (
                <div key={t._id} style={{ ...S.tableRow, flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#2563eb', fontWeight: '700' }}>Bus: {t.busNumber}</strong> 
                      <span style={{ color: '#94a3b8', margin: '0 8px' }}>|</span> 
                      Route: <span style={{ fontWeight: '600' }}>{t.routeNumber}</span>
                    </div>
                    <button style={S.delBtn} onClick={() => deleteTimetable(t._id)}>🗑️ Delete</button>
                  </div>

                  {/* Display Stops Timeline */}
                  <div style={S.stopListContainer}>
                    {(t.stops || []).map((st, i) => (
                      <div key={i} style={S.stopBadge}>
                        <span>📍 <b>{st.stopName}</b></span>
                        <span style={{ color: '#2563eb', fontWeight: '700' }}>⏰ {st.arrivalTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {safeTimetables.length === 0 && <div style={S.empty}>No schedules added yet — Add a time table above</div>}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// 🎨 Premium Styling
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
  statNum: { fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' },
  
  tabs: { display: 'flex', gap: '10px', padding: '20px 28px 0' },
  
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
  subHeading: { fontSize: '12px', fontWeight: '700', color: '#334155', marginTop: '6px' },
  formRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  
  stopRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  
  input: { 
    padding: '10px 14px', 
    borderRadius: '10px', 
    border: '1px solid #cbd5e1', 
    fontSize: '12.5px', 
    flex: 1, 
    minWidth: '140px',
    outline: 'none'
  },

  addBtn: { 
    padding: '10px 22px', 
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '12.5px', 
    fontWeight: '700', 
    cursor: 'pointer', 
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)'
  },

  secondaryBtn: {
    padding: '10px 18px',
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  removeStopBtn: {
    padding: '10px 14px',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    fontWeight: 'bold',
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
  tableRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' },
  rowMain: { flex: 1, fontSize: '13.5px', fontWeight: '600', color: '#0f172a' },
  
  stopListContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' },
  stopBadge: { display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11.5px' },

  pillGreen: { fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '99px', fontWeight: '700' },
  pillGray: { fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '99px', fontWeight: '600' },

  delBtn: { 
    padding: '7px 14px', 
    background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)', 
    color: '#be123c', 
    border: '1px solid #fecdd3', 
    borderRadius: '8px', 
    fontSize: '11.5px', 
    fontWeight: '700',
    cursor: 'pointer'
  },

  empty: { padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', fontWeight: '500' }
};