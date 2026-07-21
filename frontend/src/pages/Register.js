
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ROLES = [
  { value:'passenger', label:'Passenger', icon:'🧑', desc:'View live buses & routes' },
  { value:'driver',    label:'Driver',    icon:'🚌', desc:'Share GPS location'       },
  { value:'admin',     label:'Admin',     icon:'🛡', desc:'Manage fleet & routes'    },
];

export default function Register() {
  const [form,setForm]       = useState({ name:'',email:'',password:'',role:'passenger' });
  const [error,setError]     = useState('');
  const [loading,setLoading] = useState(false);
  const [showPass,setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const validate = () => {
    if (!form.name.trim())        return 'Full name is required.';
    if (!form.email.trim())       return 'Email address is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(); if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/api/auth/register', { name:form.name.trim(), email:form.email.trim().toLowerCase(), password:form.password, role:form.role });
      login(data.user, data.token);
      const paths = { admin:'/admin', driver:'/driver', passenger:'/passenger' };
      navigate(paths[data.user.role]||'/');
    } catch(err) {
      setError(err.response?.data?.message||'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.brand}><div style={S.brandLogo}>🚌</div><span style={S.brandName}>SmartBus</span></div>
          <h1 style={S.heroTitle}>Join Smart<br/>Bus Tracking</h1>
          <p style={S.heroDesc}>Create your account to get started with real-time GPS bus tracking across Sri Lanka.</p>
          <div style={S.rolePreviews}>
            {ROLES.map(r=>(
              <div key={r.value} style={S.rpCard}>
                <span style={{fontSize:'20px'}}>{r.icon}</span>
                <div><div style={S.rpLabel}>{r.label}</div><div style={S.rpDesc}>{r.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={S.right}>
        <div style={S.formCard}>
          <h2 style={S.formTitle}>Create your account</h2>
          <p style={S.formSub}>Fill in your details to get started</p>
          {error && <div style={S.errorBox} role="alert">⚠️ {error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div style={S.field}>
              <label style={S.label}>FULL NAME</label>
              <input style={S.input} type="text" placeholder="Your full name"
                value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoComplete="name" required />
            </div>
            <div style={S.field}>
              <label style={S.label}>EMAIL ADDRESS</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email" required />
            </div>
            <div style={S.field}>
              <label style={S.label}>PASSWORD (min 6 characters)</label>
              <div style={S.inputGroup}>
                <input style={{...S.input,paddingRight:'48px'}} type={showPass?'text':'password'} placeholder="Choose a strong password"
                  value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
                <button type="button" style={S.eyeBtn} onClick={()=>setShowPass(p=>!p)}>{showPass?'🙈':'👁'}</button>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>SELECT YOUR ROLE</label>
              <div style={S.roleGrid}>
                {ROLES.map(r=>(
                  <div key={r.value} style={{...S.roleCard,...(form.role===r.value?S.roleCardSel:{})}}
                    onClick={()=>setForm({...form,role:r.value})}>
                    <span style={{fontSize:'24px',marginBottom:'6px',display:'block'}}>{r.icon}</span>
                    <div style={{fontSize:'12px',fontWeight:'700'}}>{r.label}</div>
                    <div style={{fontSize:'10px',color:form.role===r.value?'#3b82f6':'#94a3b8',marginTop:'3px'}}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" style={{...S.submitBtn,opacity:loading?0.7:1}} disabled={loading}>
              {loading?'Creating account...':'Create account →'}
            </button>
          </form>
          <p style={S.switchText}>Already have an account? <Link to="/login" style={S.switchLink}>Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:{display:'flex',minHeight:'100vh',fontFamily:"'Segoe UI',sans-serif"},
  left:{flex:1,background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#1d4ed8 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px'},
  leftInner:{maxWidth:'400px'},
  brand:{display:'flex',alignItems:'center',gap:'12px',marginBottom:'36px'},
  brandLogo:{width:'44px',height:'44px',background:'rgba(255,255,255,0.15)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'},
  brandName:{color:'#fff',fontSize:'22px',fontWeight:'800',letterSpacing:'-0.5px'},
  heroTitle:{color:'#fff',fontSize:'36px',fontWeight:'900',lineHeight:1.2,marginBottom:'14px',letterSpacing:'-1px'},
  heroDesc:{color:'#93c5fd',fontSize:'14px',lineHeight:1.7,marginBottom:'24px'},
  rolePreviews:{display:'flex',flexDirection:'column',gap:'10px'},
  rpCard:{display:'flex',alignItems:'center',gap:'14px',background:'rgba(255,255,255,0.08)',borderRadius:'12px',padding:'12px 16px',border:'1px solid rgba(255,255,255,0.1)'},
  rpLabel:{color:'#fff',fontSize:'13px',fontWeight:'600'},
  rpDesc:{color:'#93c5fd',fontSize:'11px',marginTop:'2px'},
  right:{width:'500px',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',overflowY:'auto'},
  formCard:{background:'#fff',borderRadius:'20px',padding:'36px',boxShadow:'0 8px 40px rgba(0,0,0,0.08)',width:'100%'},
  formTitle:{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'4px',textAlign:'center',letterSpacing:'-0.5px'},
  formSub:{fontSize:'13px',color:'#94a3b8',textAlign:'center',marginBottom:'24px'},
  errorBox:{background:'#fef2f2',color:'#b91c1c',padding:'11px 14px',borderRadius:'10px',fontSize:'13px',marginBottom:'16px',border:'1px solid #fecaca'},
  field:{marginBottom:'16px'},
  label:{display:'block',fontSize:'11px',fontWeight:'700',color:'#475569',marginBottom:'6px',letterSpacing:'.06em'},
  input:{width:'100%',padding:'11px 14px',borderRadius:'10px',border:'1.5px solid #e2e8f0',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#0f172a'},
  inputGroup:{position:'relative'},
  eyeBtn:{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',border:'none',background:'transparent',cursor:'pointer',fontSize:'16px'},
  roleGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'},
  roleCard:{padding:'14px 8px',border:'1.5px solid #e2e8f0',borderRadius:'12px',cursor:'pointer',textAlign:'center',background:'#fff',color:'#64748b'},
  roleCardSel:{borderColor:'#1d4ed8',background:'#eff6ff',color:'#1e40af',boxShadow:'0 0 0 3px rgba(29,78,216,0.1)'},
  submitBtn:{width:'100%',padding:'13px',background:'linear-gradient(135deg,#1d4ed8,#2563eb)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'700',cursor:'pointer',marginTop:'6px'},
  switchText:{textAlign:'center',fontSize:'14px',color:'#64748b',marginTop:'18px'},
  switchLink:{color:'#1d4ed8',fontWeight:'700',textDecoration:'none'},
};
