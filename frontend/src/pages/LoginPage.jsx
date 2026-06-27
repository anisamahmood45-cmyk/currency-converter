import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const [show, setShow]         = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setLoading(true); setErr('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      navigate('/converter');
    } catch (error) {
      setErr(error.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={page}>
      <div style={{position:'fixed',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(59,130,246,.07)',top:'-150px',left:'-150px',filter:'blur(80px)',pointerEvents:'none'}}/>
      <div style={card}>
        <div style={logoRow}><div style={logoBox}>💱</div><span style={logoTxt}>FX Convert</span></div>
        <h1 style={h1}>Welcome back</h1>
        <p style={sub}>Sign in to access your converter & history</p>
        {err && <div style={errBox}>⚠ {err}</div>}
        <form onSubmit={handle} style={form}>
          <div style={field}><label style={lbl}>Email</label>
            <input type="email" required autoFocus placeholder="you@example.com" style={inp} value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
          <div style={field}><label style={lbl}>Password</label>
            <div style={{position:'relative'}}>
              <input type={show?'text':'password'} required placeholder="••••••••" style={{...inp,paddingRight:'44px'}} value={password} onChange={e=>setPassword(e.target.value)}/>
              <button type="button" onClick={()=>setShow(v=>!v)} style={eyeBtn}>{show?'🙈':'👁'}</button>
            </div>
          </div>
          <button type="submit" style={submitBtn} disabled={loading}>
            {loading ? <span style={spin}/> : null}{loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'22px',color:'#64748b',fontSize:'0.88rem'}}>No account? <Link to="/signup" style={{color:'#3b82f6',textDecoration:'none',fontWeight:'700'}}>Create one free</Link></p>
      </div>
    </div>
  );
}

const page={minHeight:'100vh',background:'#060c18',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Inter',sans-serif",position:'relative'};
const card={width:'100%',maxWidth:'420px',background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'26px',padding:'42px 38px',backdropFilter:'blur(24px)',boxShadow:'0 40px 80px rgba(0,0,0,.5)',position:'relative',zIndex:1};
const logoRow={display:'flex',alignItems:'center',gap:'10px',marginBottom:'30px'};
const logoBox={width:'36px',height:'36px',borderRadius:'9px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'};
const logoTxt={fontSize:'1.15rem',fontWeight:'800',color:'#f1f5f9'};
const h1={fontSize:'1.75rem',fontWeight:'800',color:'#f1f5f9',letterSpacing:'-.5px',margin:0};
const sub={color:'#64748b',fontSize:'0.9rem',marginTop:'7px',marginBottom:'26px'};
const errBox={background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#fca5a5',borderRadius:'10px',padding:'11px 15px',fontSize:'0.85rem',marginBottom:'18px'};
const form={display:'flex',flexDirection:'column',gap:'16px'};
const field={display:'flex',flexDirection:'column',gap:'7px'};
const lbl={fontSize:'12px',fontWeight:'600',color:'#94a3b8',letterSpacing:'.3px'};
const inp={background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',color:'#f1f5f9',borderRadius:'11px',padding:'12px 15px',fontSize:'0.92rem',outline:'none',fontFamily:'inherit'};
const eyeBtn={position:'absolute',right:'13px',top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',cursor:'pointer',fontSize:'15px',padding:0};
const submitBtn={background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',border:'none',padding:'13px',borderRadius:'12px',fontWeight:'800',fontSize:'0.95rem',cursor:'pointer',marginTop:'6px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 8px 24px rgba(59,130,246,.35)'};
const spin={width:'15px',height:'15px',border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite',display:'inline-block'};
