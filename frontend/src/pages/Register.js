import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const ROLES = [
  { value: 'passenger', label: 'Passenger', icon: '🧑', desc: 'View routes, track buses & check ETAs' },
  { value: 'driver',    label: 'Driver',    icon: '🚗', desc: 'Share live GPS location during trips'  },
  { value: 'admin',     label: 'Admin',     icon: '🛡️', desc: 'Manage the entire fleet and routes'    },
];

export default function Register() {
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'passenger' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, form);
      login(data.user, data.token);
      const redirect = { admin: '/admin', driver: '/driver', passenger: '/passenger' };
      navigate(redirect[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.brand}>
            <div style={S.brandIcon}>🚌</div>
            <span style={S.brandName}>SmartBus</span>
          </div>
          <h1 style={S.leftTitle}>Join the Smart<br />Bus Network.</h1>
          <p style={S.leftDesc}>
            Create your free account and get started with live bus tracking
            across the Super Line Travels network.
          </p>
          <div style={S.roleCards}>
            {ROLES.map(r => (
              <div key={r.value} style={S.rolePreview}>
                <span style={{ fontSize: '22px' }}>{r.icon}</span>
                <div>
                  <div style={S.rpLabel}>{r.label}</div>
                  <div style={S.rpDesc}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.right}>
        <div style={S.card}>
          <div style={S.cardTop}>
            <h2 style={S.cardTitle}>Create your account</h2>
            <p style={S.cardSub}>Fill in your details to get started — it's free</p>
          </div>

          {error && (
            <div style={S.errorBox}><span>⚠️</span>&nbsp;{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={S.field}>
              <label style={S.label}>Full name</label>
              <input style={S.input} type="text" placeholder="Your full name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div style={S.field}>
              <label style={S.label}>Email address</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div style={S.field}>
              <label style={S.label}>Password</label>
              <div style={S.pwWrap}>
                <input style={{ ...S.input, paddingRight: '44px' }}
                  type={showPw ? 'text' : 'password'} placeholder="Minimum 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" style={S.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Select your role</label>
              <div style={S.roleGrid}>
                {ROLES.map(r => (
                  <div key={r.value}
                    style={{ ...S.roleBtn, ...(form.role === r.value ? S.roleBtnSel : {}) }}
                    onClick={() => setForm({ ...form, role: r.value })}>
                    <span style={{ fontSize: '24px', marginBottom: '6px', display: 'block' }}>{r.icon}</span>
                    <div style={{ fontSize: '12px', fontWeight: '700' }}>{r.label}</div>
                    <div style={{ fontSize: '10px', color: form.role === r.value ? '#3b82f6' : '#94a3b8', marginTop: '3px', lineHeight: 1.3 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button style={S.submitBtn} type="submit" disabled={loading}>
              {loading ? <><span style={S.spinner} /> Creating account…</> : 'Create account →'}
            </button>
          </form>

          <p style={S.switchLine}>
            Already have an account?&nbsp;
            <Link to="/login" style={S.switchLink}>Sign in here</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  page:       { display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif" },
  left:       { flex:1, background:'linear-gradient(150deg,#0f172a 0%,#1e3a8a 55%,#1d4ed8 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px' },
  leftInner:  { maxWidth:'400px' },
  brand:      { display:'flex', alignItems:'center', gap:'12px', marginBottom:'36px' },
  brandIcon:  { width:'44px', height:'44px', background:'rgba(255,255,255,0.15)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' },
  brandName:  { color:'#fff', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.5px' },
  leftTitle:  { color:'#fff', fontSize:'38px', fontWeight:'800', lineHeight:1.2, marginBottom:'16px', letterSpacing:'-1px' },
  leftDesc:   { color:'#93c5fd', fontSize:'15px', lineHeight:1.7, marginBottom:'28px' },
  roleCards:  { display:'flex', flexDirection:'column', gap:'10px' },
  rolePreview:{ display:'flex', alignItems:'center', gap:'14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'14px 16px' },
  rpLabel:    { color:'#fff', fontSize:'13px', fontWeight:'600' },
  rpDesc:     { color:'#93c5fd', fontSize:'11px', marginTop:'2px' },
  right:      { width:'520px', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', overflowY:'auto' },
  card:       { background:'#fff', borderRadius:'20px', padding:'36px', boxShadow:'0 8px 40px rgba(0,0,0,0.08)', width:'100%' },
  cardTop:    { marginBottom:'24px', textAlign:'center' },
  cardTitle:  { fontSize:'22px', fontWeight:'800', color:'#0f172a', marginBottom:'6px', letterSpacing:'-0.5px' },
  cardSub:    { fontSize:'13px', color:'#94a3b8' },
  errorBox:   { background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca', borderRadius:'10px', padding:'11px 14px', fontSize:'13px', marginBottom:'16px', display:'flex', alignItems:'center' },
  field:      { marginBottom:'16px' },
  label:      { display:'block', fontSize:'12px', fontWeight:'700', color:'#475569', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.05em' },
  input:      { width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'12px', fontSize:'14px', outline:'none', color:'#0f172a', boxSizing:'border-box', fontFamily:'inherit' },
  pwWrap:     { position:'relative' },
  eyeBtn:     { position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', cursor:'pointer', fontSize:'16px' },
  roleGrid:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' },
  roleBtn:    { padding:'14px 8px', border:'1.5px solid #e2e8f0', borderRadius:'12px', cursor:'pointer', textAlign:'center', background:'#fff', color:'#334155', transition:'all .15s' },
  roleBtnSel: { borderColor:'#1d4ed8', background:'#eff6ff', color:'#1e40af', boxShadow:'0 0 0 3px rgba(29,78,216,0.1)' },
  submitBtn:  { width:'100%', padding:'13px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700', cursor:'pointer', marginTop:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
  spinner:    { width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .8s linear infinite' },
  switchLine: { textAlign:'center', fontSize:'14px', color:'#64748b', marginTop:'18px' },
  switchLink: { color:'#1d4ed8', fontWeight:'700', textDecoration:'none' },
};