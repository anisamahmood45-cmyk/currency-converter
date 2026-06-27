import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const nav = {
    position:'fixed', top:0, left:0, right:0, zIndex:1000,
    padding:'0 5%',
    background: scrolled ? 'rgba(6,12,24,.96)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,.06)' : 'none',
    transition:'all .3s', height:'64px', display:'flex', alignItems:'center',
  };

  return (
    <nav style={nav}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',maxWidth:'1200px',margin:'0 auto'}}>
        <Link to="/converter" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'9px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',boxShadow:'0 4px 14px rgba(59,130,246,.4)'}}>💱</div>
          <span style={{fontSize:'1.15rem',fontWeight:'800',letterSpacing:'-.5px',color:'#f1f5f9'}}>FX Convert</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
          {!token ? (
            <>
              <Link to="/login"  style={{color:'#94a3b8',textDecoration:'none',fontWeight:'500',fontSize:'0.9rem'}}>Login</Link>
              <Link to="/signup" style={{background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',padding:'8px 18px',borderRadius:'10px',textDecoration:'none',fontWeight:'700',fontSize:'0.88rem',boxShadow:'0 4px 14px rgba(59,130,246,.35)'}}>Sign Up Free</Link>
            </>
          ) : (
            <button onClick={logout} style={{background:'transparent',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',padding:'8px 16px',borderRadius:'8px',fontWeight:'600',fontSize:'0.88rem'}}>Logout</button>
          )}
        </div>
      </div>
    </nav>
  );
}
