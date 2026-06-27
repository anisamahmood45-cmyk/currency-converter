import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FIAT = [
  {code:'USD',flag:'🇺🇸',name:'US Dollar'},{code:'EUR',flag:'🇪🇺',name:'Euro'},
  {code:'GBP',flag:'🇬🇧',name:'Brit. Pound'},{code:'PKR',flag:'🇵🇰',name:'Pak. Rupee'},
  {code:'AED',flag:'🇦🇪',name:'UAE Dirham'},{code:'SAR',flag:'🇸🇦',name:'Saudi Riyal'},
  {code:'CAD',flag:'🇨🇦',name:'Canadian $'},{code:'AUD',flag:'🇦🇺',name:'Aus. Dollar'},
  {code:'JPY',flag:'🇯🇵',name:'Japanese Yen'},{code:'CHF',flag:'🇨🇭',name:'Swiss Franc'},
  {code:'INR',flag:'🇮🇳',name:'Indian Rupee'},{code:'CNY',flag:'🇨🇳',name:'Chinese Yuan'},
  {code:'SGD',flag:'🇸🇬',name:'Singapore $'},{code:'MYR',flag:'🇲🇾',name:'Malaysian RM'},
  {code:'TRY',flag:'🇹🇷',name:'Turkish Lira'},{code:'KWD',flag:'🇰🇼',name:'Kuwaiti Dinar'},
  {code:'QAR',flag:'🇶🇦',name:'Qatari Riyal'},{code:'BHD',flag:'🇧🇭',name:'Bahraini Dinar'},
];
const CRYPTO = [
  {code:'BTC',flag:'₿',name:'Bitcoin'},{code:'ETH',flag:'Ξ',name:'Ethereum'},
  {code:'USDT',flag:'₮',name:'Tether'},{code:'BNB',flag:'⬡',name:'BNB'},
  {code:'SOL',flag:'◎',name:'Solana'},
];
const CURRENCIES = [...FIAT, ...CRYPTO];
const FLAGS = Object.fromEntries(CURRENCIES.map(c=>[c.code,c.flag]));
const NAMES = Object.fromEntries(CURRENCIES.map(c=>[c.code,c.name]));
const CRYPTO_CODES = new Set(CRYPTO.map(c=>c.code));
const FIAT_FALLBACK = {USD:1,EUR:.92,GBP:.79,PKR:278,AED:3.67,SAR:3.75,CAD:1.37,AUD:1.54,JPY:149,CHF:.89,INR:83.2,CNY:7.27,SGD:1.35,MYR:4.71,TRY:32.1,KWD:.31,QAR:3.64,BHD:.38};
const CRYPTO_FALLBACK = {BTC:67000,ETH:3500,USDT:1,BNB:580,SOL:170};
const QUICK = [['USD','PKR'],['EUR','USD'],['GBP','PKR'],['AED','PKR'],['BTC','USD'],['ETH','USD']];
const SHOW_RATES = ['EUR','GBP','PKR','AED','SAR','JPY','INR','CAD'];
const MULTI_AMTS = [1,5,10,50,100,500,1000];
const hdrs = ()=>({Authorization:`Bearer ${localStorage.getItem('token')}`});

export default function ConverterPage() {
  const navigate = useNavigate();
  const [fiatRates, setFiatRates]     = useState(FIAT_FALLBACK);
  const [cryptoRates, setCryptoRates] = useState(CRYPTO_FALLBACK);
  const [from, setFrom]       = useState('USD');
  const [to, setTo]           = useState('PKR');
  const [amount, setAmount]   = useState('1');
  const [fee, setFee]         = useState('0');
  const [result, setResult]   = useState(null);
  const [rateText, setRateText]   = useState('');
  const [isLive, setIsLive]       = useState(false);
  const [favs, setFavs]           = useState([]);
  const [history, setHistory]     = useState([]);
  const [chartPeriod, setChartPeriod] = useState(7);
  const [chartSub, setChartSub]   = useState('');
  const [chartStats, setChartStats] = useState(null);
  const [conversions, setConversions] = useState(0);
  const [toast, setToast]         = useState('');
  const [showMulti, setShowMulti] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    axios.get('/api/rates/latest', { headers: hdrs() })
      .then(({ data }) => { setFiatRates(data.rates); setIsLive(true); })
      .catch(() => setIsLive(false));
    axios.get('/api/rates/crypto', { headers: hdrs() })
      .then(({ data }) => setCryptoRates(data.rates))
      .catch(() => {});
    axios.get('/api/favorites', { headers: hdrs() })
      .then(({ data }) => setFavs(data.map(f=>`${f.from}-${f.to}`)))
      .catch(err => { if (err.response?.status===401) { localStorage.removeItem('token'); navigate('/login'); } });
    axios.get('/api/history', { headers: hdrs() })
      .then(({ data }) => setHistory(data))
      .catch(() => {});
  }, []);

  useEffect(() => { convert(); }, [from, to, amount, fee, fiatRates, cryptoRates]);
  useEffect(() => { if (!CRYPTO_CODES.has(from) && !CRYPTO_CODES.has(to)) drawChart(); }, [from, to, chartPeriod]);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''), 2400); };

  const getRate = useCallback((f, t) => {
    const all = { ...fiatRates };
    CRYPTO.forEach(c => { if (cryptoRates[c.code]) all[c.code] = 1 / cryptoRates[c.code]; });
    if (f==='USD') return all[t] || 1;
    if (t==='USD') return 1 / (all[f] || 1);
    return (all[t]||1) / (all[f]||1);
  }, [fiatRates, cryptoRates]);

  const convert = useCallback(() => {
    const a = parseFloat(amount);
    if (!a || a<=0 || from===to) { setResult(null); setRateText('Enter an amount'); return; }
    const rate = getRate(from, to);
    setResult(a * rate);
    setRateText(`1 ${from} = ${rate.toLocaleString('en-US',{maximumFractionDigits:4})} ${to}`);
    setConversions(c=>c+1);
  }, [from, to, amount, fee, getRate]);

  const resultAfterFee = result!=null ? result*(1-parseFloat(fee||0)/100) : null;

  const saveConversion = async () => {
    if (!result) return;
    const rate = getRate(from, to);
    try {
      const { data } = await axios.post('/api/history', { from, to, amount:parseFloat(amount), result, rate }, { headers: hdrs() });
      setHistory(prev=>[data,...prev].slice(0,20));
      showToast('✅ Saved to history');
    } catch { showToast('❌ Could not save'); }
  };

  const toggleFav = async (f, t) => {
    const key=`${f}-${t}`;
    try {
      await axios.post('/api/favorites', { from:f, to:t }, { headers: hdrs() });
      setFavs(prev=>prev.includes(key)?prev.filter(k=>k!==key):[...prev,key]);
    } catch { showToast('❌ Could not save'); }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.toLocaleString('en-US',{maximumFractionDigits:2}));
    showToast('📋 Copied!');
  };

  const swap = () => { setFrom(to); setTo(from); };

  const drawChart = async () => {
    if (!canvasRef.current || from===to || CRYPTO_CODES.has(from) || CRYPTO_CODES.has(to)) return;
    setChartSub('Loading...');
    let dates=[], ratesArr=[];
    try {
      const { data } = await axios.get(`/api/rates/history?from=${from}&to=${to}&days=${chartPeriod}`, { headers: hdrs() });
      dates    = Object.keys(data.rates).sort();
      ratesArr = dates.map(d=>data.rates[d][to]);
    } catch {
      const base = getRate(from, to);
      for (let i=chartPeriod;i>=0;i--) {
        const d=new Date(); d.setDate(d.getDate()-i);
        dates.push(d.toISOString().split('T')[0]);
        ratesArr.push(base*(1+Math.sin(i*.7)*.012));
      }
    }
    setChartSub(`${chartPeriod}-day · ${dates.length} points`);
    if (!ratesArr.length) return;
    const chg=ratesArr[ratesArr.length-1]-ratesArr[0];
    setChartStats({ high:Math.max(...ratesArr), low:Math.min(...ratesArr), open:ratesArr[0], change:chg, changePct:chg/ratesArr[0]*100 });
    renderCanvas(dates, ratesArr);
  };

  const renderCanvas = (dates, ratesArr) => {
    const canvas=canvasRef.current; if (!canvas) return;
    const W=canvas.parentElement.getBoundingClientRect().width||700;
    canvas.width=W; canvas.height=200;
    const ctx=canvas.getContext('2d');
    const pad={l:58,r:14,t:14,b:26};
    const cW=W-pad.l-pad.r, cH=200-pad.t-pad.b;
    const minR=Math.min(...ratesArr)*.9985, maxR=Math.max(...ratesArr)*1.0015;
    const xS=i=>pad.l+(i/(ratesArr.length-1||1))*cW;
    const yS=r=>pad.t+(1-(r-minR)/(maxR-minR||1))*cH;
    ctx.clearRect(0,0,W,200);
    for(let i=0;i<=4;i++){
      const y=pad.t+(i/4)*cH;
      ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
      const val=maxR-(i/4)*(maxR-minR);
      ctx.fillStyle='#64748b'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='right';
      ctx.fillText(val>100?Math.round(val):val.toFixed(4), pad.l-5, y+4);
    }
    const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
    grad.addColorStop(0,'rgba(59,130,246,0.25)'); grad.addColorStop(1,'rgba(59,130,246,0.01)');
    ctx.beginPath(); ctx.moveTo(xS(0),yS(ratesArr[0]));
    for(let i=1;i<ratesArr.length;i++){const cpx=(xS(i-1)+xS(i))/2;ctx.bezierCurveTo(cpx,yS(ratesArr[i-1]),cpx,yS(ratesArr[i]),xS(i),yS(ratesArr[i]));}
    ctx.lineTo(xS(ratesArr.length-1),pad.t+cH); ctx.lineTo(xS(0),pad.t+cH); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xS(0),yS(ratesArr[0]));
    for(let i=1;i<ratesArr.length;i++){const cpx=(xS(i-1)+xS(i))/2;ctx.bezierCurveTo(cpx,yS(ratesArr[i-1]),cpx,yS(ratesArr[i]),xS(i),yS(ratesArr[i]));}
    ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2.5; ctx.stroke();
    const lx=xS(ratesArr.length-1), ly=yS(ratesArr[ratesArr.length-1]);
    ctx.beginPath(); ctx.arc(lx,ly,5,0,Math.PI*2); ctx.fillStyle='#3b82f6'; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    const step=Math.max(1,Math.floor(dates.length/5));
    ctx.fillStyle='#64748b'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center';
    for(let i=0;i<dates.length;i+=step){const d=new Date(dates[i]+'T00:00:00');ctx.fillText(d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),xS(i),196);}
  };

  const fmtR = (v, code) => v==null?'—':CRYPTO_CODES.has(code)?v.toLocaleString('en-US',{maximumFractionDigits:8}):v.toLocaleString('en-US',{maximumFractionDigits:code==='JPY'?0:2});
  const compareAll = CURRENCIES.filter(c=>c.code!==from).map(c=>({...c,converted:(parseFloat(amount)||1)*getRate(from,c.code)})).sort((a,b)=>b.converted-a.converted);
  const displayedCompare = showCrypto ? compareAll : compareAll.filter(c=>!CRYPTO_CODES.has(c.code));

  return (
    <div style={{background:'#060c18',minHeight:'100vh',padding:'80px 0 80px',fontFamily:"'Inter',sans-serif",position:'relative',overflow:'hidden'}}>
      <div style={{position:'fixed',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(59,130,246,.08)',top:'-200px',left:'-150px',filter:'blur(100px)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(139,92,246,.07)',bottom:'-200px',right:'-100px',filter:'blur(100px)',pointerEvents:'none'}}/>

      {/* TICKER */}
      <div style={{background:'rgba(13,20,38,.95)',borderBottom:'1px solid rgba(255,255,255,.07)',padding:'9px 0',overflow:'hidden',position:'relative',zIndex:2}}>
        <div style={{display:'flex',animation:'ticker 30s linear infinite',whiteSpace:'nowrap',width:'max-content'}}>
          {[...QUICK,...QUICK].map(([a,b],i)=>{
            const r=getRate(a,b);
            return <span key={i} style={{display:'inline-flex',alignItems:'center',gap:'7px',padding:'0 22px',fontSize:'12px',fontWeight:'600',color:'#64748b',borderRight:'1px solid rgba(255,255,255,.07)'}}>
              <span style={{color:'#f1f5f9'}}>{FLAGS[a]}{a}/{b}{FLAGS[b]}</span>
              <span style={{color:'#3b82f6'}}>{r.toLocaleString('en-US',{maximumFractionDigits:4})}</span>
            </span>;
          })}
        </div>
      </div>

      {toast&&<div style={{position:'fixed',bottom:'28px',left:'50%',transform:'translateX(-50%)',background:'rgba(13,20,38,.98)',border:'1px solid rgba(59,130,246,.3)',color:'#f1f5f9',fontSize:'13px',fontWeight:'600',padding:'12px 24px',borderRadius:'12px',zIndex:999,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{toast}</div>}

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'30px 16px 0',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <h1 style={{fontSize:'clamp(22px,5vw,42px)',fontWeight:'900',letterSpacing:'-1.5px',marginBottom:'8px'}}>
            Live <span style={{background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Currency</span> Exchange
          </h1>
          <p style={{color:'#64748b',fontSize:'13px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',color:'#10b981',padding:'4px 10px',borderRadius:'18px',fontSize:'11px',fontWeight:'700'}}>
              <span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#10b981',animation:'livePulse 2s infinite',display:'inline-block'}}/>
              {isLive?'LIVE':'FALLBACK'}
            </span>
            23 currencies · live rates · crypto prices
          </p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 290px',gap:'18px',alignItems:'start'}}>
          {/* CONVERTER */}
          <div style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'22px',padding:'26px',backdropFilter:'blur(24px)',boxShadow:'0 32px 80px rgba(0,0,0,.5)'}}>
            {/* Quick pairs */}
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'20px'}}>
              {QUICK.map(([a,b])=>{
                const key=`${a}-${b}`,isFav=favs.includes(key);
                return(
                  <button key={key} onClick={()=>{setFrom(a);setTo(b);}} style={{background:from===a&&to===b?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',border:`1px solid ${from===a&&to===b?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:from===a&&to===b?'#93c5fd':'#64748b',fontSize:'11px',fontWeight:'600',padding:'5px 10px',borderRadius:'16px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px'}}>
                    {a}→{b}
                    <span onClick={e=>{e.stopPropagation();toggleFav(a,b);}} style={{opacity:isFav?1:.35,fontSize:'11px'}}>{isFav?'★':'☆'}</span>
                  </button>
                );
              })}
            </div>

            {/* Panels */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 46px 1fr',gap:'7px',alignItems:'center',marginBottom:'14px'}}>
              {[{sel:from,setS:setFrom,isFrom:true},{sel:to,setS:setTo,isFrom:false}].map((p,idx)=>(
                <React.Fragment key={idx}>
                  {idx===1&&<div style={{display:'flex',justifyContent:'center'}}><button onClick={swap} style={{width:'42px',height:'42px',borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',border:'none',color:'#fff',fontSize:'16px',cursor:'pointer',boxShadow:'0 4px 16px rgba(59,130,246,.4)'}}>⇄</button></div>}
                  <div style={{background:'rgba(30,41,59,.55)',border:'1.5px solid rgba(255,255,255,.07)',borderRadius:'15px',padding:'14px'}}>
                    <div style={{fontSize:'9px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:'8px'}}>{p.isFrom?'From':'To'}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'5px',paddingBottom:'8px',marginBottom:'8px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                      <span style={{fontSize:'17px'}}>{FLAGS[p.sel]||'🏳'}</span>
                      <select value={p.sel} onChange={e=>p.setS(e.target.value)} style={{background:'transparent',border:'none',color:'#f1f5f9',fontSize:'13px',fontWeight:'700',outline:'none',cursor:'pointer',flex:1,fontFamily:'inherit'}}>
                        <optgroup label="Fiat">{FIAT.map(c=><option key={c.code} value={c.code} style={{background:'#1e293b'}}>{c.code}</option>)}</optgroup>
                        <optgroup label="Crypto">{CRYPTO.map(c=><option key={c.code} value={c.code} style={{background:'#1e293b'}}>{c.code}</option>)}</optgroup>
                      </select>
                    </div>
                    {p.isFrom
                      ? <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{width:'100%',background:'transparent',border:'none',color:'#f1f5f9',fontSize:'24px',fontWeight:'900',outline:'none',fontFamily:'inherit'}}/>
                      : <div style={{fontSize:'24px',fontWeight:'900',color:'#3b82f6',minHeight:'32px'}}>{fmtR(result,to)}</div>
                    }
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Rate + fee */}
            <div style={{background:'rgba(30,41,59,.5)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',padding:'12px 15px',marginBottom:'11px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'9px'}}>
                <span style={{fontSize:'12px',color:'#64748b'}}>{rateText}</span>
                <span style={{fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'6px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',color:'#3b82f6'}}>{isLive?'Live':'Fallback'}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                <span style={{fontSize:'11px',color:'#64748b',fontWeight:'600',whiteSpace:'nowrap'}}>Fee:</span>
                <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
                  <input type="number" min="0" max="100" step="0.1" value={fee} onChange={e=>setFee(e.target.value)} style={{width:'56px',background:'rgba(6,12,24,.7)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',color:'#f1f5f9',fontSize:'12px',padding:'4px 7px',outline:'none',fontFamily:'inherit'}}/>
                  <span style={{fontSize:'12px',color:'#64748b'}}>%</span>
                </div>
                {parseFloat(fee)>0&&result!=null&&(
                  <div style={{marginLeft:'auto',textAlign:'right'}}>
                    <div style={{fontSize:'9px',color:'#64748b'}}>You receive</div>
                    <div style={{fontSize:'13px',fontWeight:'800',color:'#10b981'}}>{fmtR(resultAfterFee,to)} {to}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'7px'}}>
              <button onClick={copyResult}    style={{...btnBlue,fontSize:'12px'}}>📋 Copy</button>
              <button onClick={saveConversion} style={{...btnGreen,fontSize:'12px'}}>💾 Save</button>
              <button onClick={()=>setShowMulti(v=>!v)} style={{...btnGhost,fontSize:'12px',border:`1px solid ${showMulti?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:showMulti?'#93c5fd':'#94a3b8'}}>⊞ Table</button>
            </div>

            {/* MULTI-AMOUNT TABLE */}
            {showMulti&&(
              <div style={{marginTop:'12px',background:'rgba(30,41,59,.5)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'12px',overflow:'hidden'}}>
                <div style={{padding:'9px 13px',fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                  {FLAGS[from]}{from} → {FLAGS[to]}{to} Quick Reference
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                  {MULTI_AMTS.map((a,i)=>(
                    <div key={a} onClick={()=>setAmount(String(a))} style={{display:'flex',justifyContent:'space-between',padding:'8px 13px',borderBottom:i<MULTI_AMTS.length-2?'1px solid rgba(255,255,255,.05)':'none',borderRight:i%2===0?'1px solid rgba(255,255,255,.05)':'none',cursor:'pointer',background:parseFloat(amount)===a?'rgba(59,130,246,.08)':'transparent'}}>
                      <span style={{fontSize:'11px',color:'#64748b',fontWeight:'600'}}>{a} {from}</span>
                      <span style={{fontSize:'11px',color:'#f1f5f9',fontWeight:'700'}}>{fmtR(a*getRate(from,to),to)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{display:'flex',flexDirection:'column',gap:'13px'}}>
            <div style={cardSm}>
              <div style={smTitle}>Fiat vs USD</div>
              {SHOW_RATES.map(code=>(
                <div key={code} onClick={()=>{setFrom('USD');setTo(code);}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.06)',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <span style={{fontSize:'15px'}}>{FLAGS[code]}</span>
                    <div><div style={{fontSize:'11px',fontWeight:'700',color:'#f1f5f9'}}>{code}</div><div style={{fontSize:'9px',color:'#64748b'}}>{NAMES[code]}</div></div>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'800',color:'#f1f5f9'}}>{(fiatRates[code]||0).toLocaleString('en-US',{maximumFractionDigits:code==='JPY'?0:4})}</div>
                </div>
              ))}
            </div>

            <div style={cardSm}>
              <div style={smTitle}>Crypto (USD)</div>
              {CRYPTO.map(c=>(
                <div key={c.code} onClick={()=>{setFrom(c.code);setTo('USD');}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.06)',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <div style={{width:'24px',height:'24px',borderRadius:'6px',background:'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#f59e0b',fontWeight:'900'}}>{c.flag}</div>
                    <div><div style={{fontSize:'11px',fontWeight:'700',color:'#f1f5f9'}}>{c.code}</div><div style={{fontSize:'9px',color:'#64748b'}}>{c.name}</div></div>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'800',color:'#f59e0b'}}>${(cryptoRates[c.code]||0).toLocaleString('en-US',{maximumFractionDigits:2})}</div>
                </div>
              ))}
            </div>

            <div style={cardSm}>
              <div style={smTitle}>Session</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>
                {[{val:conversions,lbl:'Conversions'},{val:23,lbl:'Currencies'},{val:favs.length,lbl:'Favorites'},{val:history.length,lbl:'Saved'}].map((s,i)=>(
                  <div key={i} style={{background:'rgba(30,41,59,.5)',borderRadius:'9px',padding:'9px'}}>
                    <div style={{fontSize:'15px',fontWeight:'800',color:'#3b82f6',marginBottom:'1px'}}>{s.val}</div>
                    <div style={{fontSize:'9px',color:'#64748b',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.5px'}}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CHART */}
        {!CRYPTO_CODES.has(from)&&!CRYPTO_CODES.has(to)&&(
          <div style={{...cardSm,marginTop:'18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px',flexWrap:'wrap',gap:'7px'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#f1f5f9'}}>{FLAGS[from]}{from} → {FLAGS[to]}{to} Rate History</div>
                <div style={{fontSize:'10px',color:'#64748b',marginTop:'2px'}}>{chartSub}</div>
              </div>
              <div style={{display:'flex',gap:'5px'}}>
                {[7,14,30].map(d=>(
                  <button key={d} onClick={()=>setChartPeriod(d)} style={{background:chartPeriod===d?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',border:`1px solid ${chartPeriod===d?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:chartPeriod===d?'#93c5fd':'#64748b',fontSize:'11px',fontWeight:'700',padding:'4px 10px',borderRadius:'7px',cursor:'pointer'}}>{d}D</button>
                ))}
              </div>
            </div>
            <canvas ref={canvasRef} style={{width:'100%',display:'block',borderRadius:'7px',marginTop:'10px'}}/>
            {chartStats&&(
              <div style={{display:'flex',gap:'18px',flexWrap:'wrap',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
                {[
                  {l:'Open', v:chartStats.open>100?chartStats.open.toFixed(2):chartStats.open.toFixed(4)},
                  {l:'High', v:chartStats.high>100?chartStats.high.toFixed(2):chartStats.high.toFixed(4)},
                  {l:'Low',  v:chartStats.low>100?chartStats.low.toFixed(2):chartStats.low.toFixed(4)},
                  {l:'Change',v:`${chartStats.change>=0?'+':''}${chartStats.changePct.toFixed(2)}%`,c:chartStats.change>=0?'#10b981':'#ef4444'},
                ].map(s=>(
                  <span key={s.l} style={{fontSize:'12px',color:'#64748b'}}>{s.l}: <strong style={{color:s.c||'#f1f5f9'}}>{s.v}</strong></span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPARE ALL */}
        <div style={{...cardSm,marginTop:'18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div style={smTitle}>Compare All — {parseFloat(amount)||1} {FLAGS[from]}{from}</div>
            <button onClick={()=>setShowCrypto(v=>!v)} style={{background:showCrypto?'rgba(245,158,11,.15)':'rgba(30,41,59,.7)',border:`1px solid ${showCrypto?'rgba(245,158,11,.3)':'rgba(255,255,255,.07)'}`,color:showCrypto?'#f59e0b':'#64748b',fontSize:'10px',fontWeight:'700',padding:'4px 10px',borderRadius:'7px',cursor:'pointer'}}>
              {showCrypto?'₿ Hide Crypto':'₿ Show Crypto'}
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'7px'}}>
            {displayedCompare.map(c=>(
              <div key={c.code} onClick={()=>{setFrom(from);setTo(c.code);}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(30,41,59,.5)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'10px',padding:'8px 11px',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{fontSize:'16px'}}>{c.flag}</span>
                  <div><div style={{fontSize:'11px',fontWeight:'700',color:'#f1f5f9'}}>{c.code}</div><div style={{fontSize:'9px',color:'#64748b'}}>{c.name}</div></div>
                </div>
                <div style={{fontSize:'11px',fontWeight:'800',color:CRYPTO_CODES.has(c.code)?'#f59e0b':'#3b82f6'}}>{fmtR(c.converted,c.code)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        {history.length>0&&(
          <div style={{...cardSm,marginTop:'18px'}}>
            <div style={smTitle}>Conversion History</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'240px',overflowY:'auto'}}>
              {history.map(h=>(
                <div key={h._id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(30,41,59,.45)',borderRadius:'10px',padding:'9px 12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0}}>
                    <span style={{fontSize:'14px'}}>{FLAGS[h.from]}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:'11px',fontWeight:'700',color:'#f1f5f9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.amount.toLocaleString()} {h.from} → {fmtR(h.result,h.to)} {h.to}</div>
                      <div style={{fontSize:'9px',color:'#64748b'}}>Rate: {h.rate.toFixed(4)} · {new Date(h.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                    </div>
                  </div>
                  <span style={{fontSize:'14px',flexShrink:0}}>{FLAGS[h.to]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cardSm ={background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'18px',backdropFilter:'blur(24px)'};
const smTitle={fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'};
const btnBlue ={background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',border:'none',padding:'10px',borderRadius:'10px',fontWeight:'700',cursor:'pointer',boxShadow:'0 4px 16px rgba(59,130,246,.35)'};
const btnGreen={background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',color:'#10b981',padding:'10px',borderRadius:'10px',fontWeight:'700',cursor:'pointer'};
const btnGhost={background:'rgba(30,41,59,.7)',padding:'10px',borderRadius:'10px',fontWeight:'600',cursor:'pointer'};
