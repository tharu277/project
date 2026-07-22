import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) { 
      setError('Please enter both email and password.'); 
      return; 
    }
    setLoading(true); 
    setError('');

    try {
      const { data } = await api.post('/api/auth/login', { 
        email: form.email.trim().toLowerCase(), 
        password: form.password 
      });

      login(data.user, data.token);

      // App.jsx එකේ Routes වලට හරියටම Match වන paths:
      const userRole = data.user?.role?.toLowerCase();
      
      const paths = { 
        admin: '/admin', 
        driver: '/driver', 
        passenger: '/passenger' 
      };

      // Role එක හරි එකට Redirect කරන්න, නැත්නම් default /passenger එකට යවන්න
      navigate(paths[userRole] || '/passenger');

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your connection.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.brand}><div style={S.brandLogo}>🚌</div><span style={S.brandName}>SmartBus</span></div>
          <h1 style={S.heroTitle}>Track every bus,<br/>in real time.</h1>
          <p style={S.heroDesc}>Live GPS tracking for passengers, drivers and administrators of Super Line Travels — all in one place.</p>
          <ul style={S.featureList}>
            {['📍 Real-time bus locations on live map','⏱ Estimated time of arrival (ETA)','🔍 Search by route or destination','🔒 Secure role-based access'].map((f,i)=>(
              <li key={i} style={S.featureItem}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={S.right}>
        <div style={S.formCard}>
          <h2 style={S.formTitle}>Sign in to your account</h2>
          <p style={S.formSub}>Enter your credentials to continue</p>
          {error && <div style={S.errorBox} role="alert">⚠️ {error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div style={S.field}>
              <label style={S.label}>EMAIL ADDRESS</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email" required />
            </div>
            <div style={S.field}>
              <label style={S.label}>PASSWORD</label>
              <div style={S.inputGroup}>
                <input style={{...S.input,paddingRight:'48px'}} type={showPass?'text':'password'} placeholder="••••••••"
                  value={form.password} onChange={e=>setForm({...form,password:e.target.value})} autoComplete="current-password" required />
                <button type="button" style={S.eyeBtn} onClick={()=>setShowPass(p=>!p)} aria-label={showPass?'Hide':'Show'}>
                  {showPass?'🙈':'👁'}
                </button>
              </div>
            </div>
            <button type="submit" style={{...S.submitBtn,opacity:loading?0.7:1}} disabled={loading}>
              {loading?<span style={S.btnRow}><span style={S.spinner}></span>Signing in...</span>:'Sign in →'}
            </button>
          </form>
          <p style={S.switchText}>Don't have an account? <Link to="/register" style={S.switchLink}>Create one here</Link></p>
          <div style={S.roleHints}>
            {[{i:'',l:'Admin'},{i:'🚌',l:'Driver'},{i:'🧑',l:'Passenger'}].map(r=>(
              <span key={r.l} style={S.roleHint}>{r.i} {r.l}</span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  page:{display:'flex',minHeight:'100vh',fontFamily:"'Segoe UI',sans-serif"},
  left:{flex:1,background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#1d4ed8 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px'},
  leftInner:{maxWidth:'420px'},
  brand:{display:'flex',alignItems:'center',gap:'12px',marginBottom:'40px'},
  brandLogo:{width:'44px',height:'44px',background:'rgba(255,255,255,0.15)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'},
  brandName:{color:'#fff',fontSize:'22px',fontWeight:'800',letterSpacing:'-0.5px'},
  heroTitle:{color:'#fff',fontSize:'38px',fontWeight:'900',lineHeight:1.2,marginBottom:'16px',letterSpacing:'-1px'},
  heroDesc:{color:'#93c5fd',fontSize:'15px',lineHeight:1.7,marginBottom:'28px'},
  featureList:{listStyle:'none',padding:0,display:'flex',flexDirection:'column',gap:'10px'},
  featureItem:{color:'#bfdbfe',fontSize:'14px'},
  right:{width:'480px',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px'},
  formCard:{background:'#fff',borderRadius:'20px',padding:'40px',boxShadow:'0 8px 40px rgba(0,0,0,0.08)',width:'100%'},
  formTitle:{fontSize:'24px',fontWeight:'800',color:'#0f172a',marginBottom:'6px',textAlign:'center',letterSpacing:'-0.5px'},
  formSub:{fontSize:'13px',color:'#94a3b8',textAlign:'center',marginBottom:'28px'},
  errorBox:{background:'#fef2f2',color:'#b91c1c',padding:'12px 16px',borderRadius:'10px',fontSize:'13px',marginBottom:'20px',border:'1px solid #fecaca'},
  field:{marginBottom:'18px'},
  label:{display:'block',fontSize:'11px',fontWeight:'700',color:'#475569',marginBottom:'6px',letterSpacing:'.06em'},
  input:{width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e2e8f0',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#0f172a'},
  inputGroup:{position:'relative'},
  eyeBtn:{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',border:'none',background:'transparent',cursor:'pointer',fontSize:'16px'},
  submitBtn:{width:'100%',padding:'14px',background:'linear-gradient(135deg,#1d4ed8,#2563eb)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'700',cursor:'pointer',marginTop:'8px'},
  btnRow:{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'},
  spinner:{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block'},
  switchText:{textAlign:'center',fontSize:'14px',color:'#64748b',marginTop:'20px'},
  switchLink:{color:'#1d4ed8',fontWeight:'700',textDecoration:'none'},
  roleHints:{display:'flex',justifyContent:'center',gap:'10px',marginTop:'20px',flexWrap:'wrap'},
  roleHint:{fontSize:'11px',color:'#94a3b8',background:'#f8fafc',padding:'5px 12px',borderRadius:'99px',border:'1px solid #e2e8f0'},
};