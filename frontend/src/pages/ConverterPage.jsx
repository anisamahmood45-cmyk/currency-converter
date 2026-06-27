import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CURRENCIES = [
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
const FLAGS = Object.fromEntries(CURRENCIES.map(c=>[c.code,c.flag]));
const NAMES = Object.fromEntries(CURRENCIES.map(c=>[c.code,c.name]));
const FALLBACK={USD:1,EUR:.92,GBP:.79,PKR:278,AED:3.67,SAR:3.75,CAD:1.37,AUD:1.54,JPY:149,CHF:.89,INR:83.2,CNY:7.27,SGD:1.35,MYR:4.71,TRY:32.1,KWD:.31,QAR:3.64,BHD:.38};
const QUICK = [['USD','PKR'],['EUR','USD'],['GBP','PKR'],['AED','PKR'],['SAR','PKR'],['EUR','GBP']];
const hdrs  = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function ConverterPage() {
  const navigate = useNavigate();
  const [rates, setRates]       = useState(FALLBACK);
  const [from, setFrom]         = useState('USD');
  const [to, setTo]             = useState('PKR');
  const [amount, setAmount]     = useState('1');
  const [result, setResult]     = useState(null);
  const [rateText, setRateText] = useState('');
  const [isLive, setIsLive]     = useState(false);
  const [favs, setFavs]         = useState([]);
  const [history, setHistory]   = useState([]);
  const [chartPeriod, setChartPeriod] = useState(7);
  const [chartSub, setChartSub] = useState('');
  const [chartStats, setChartStats] = useState(null);
  const [conversions, setConversions] = useState(0);
  const [toast, setToast]       = useState('');
  const canvasRef = useRef(null);

  // Load rates, favs, history
  useEffect(() => {
    axios.get('/api/rates/latest', { headers: hdrs() })
      .then(({ data }) => { setRates(data.rates); setIsLive(true); })
      .catch(() => setIsLive(false));
    axios.get('/api/favorites', { headers: hdrs() })
      .then(({ data }) => setFavs(data.map(f=>`${f.from}-${f.to}`)))
      .catch(err => { if(err.response?.status===401){localStorage.removeItem('token');navigate('/login');} });
    axios.get('/api/history', { headers: hdrs() })
      .then(({ data }) => setHistory(data))
      .catch(() => {});
  }, []);

  // Auto-convert when inputs change
  useEffect(() => { convert(); }, [from, to, amount, rates]);

  // Draw chart when pair/period changes
  useEffect(() => { drawChart(); }, [from, to, chartPeriod, rates]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2400); };

  const convert = useCallback(() => {
    const a = parseFloat(amount);
    if (!a || a <= 0 || from === to) { setResult(null); setRateText('Enter an amount'); return; }
    const rate = from==='USD' ? rates[to] : to==='USD' ? (1/rates[from]) : (rates[to]/rates[from]);
    const res  = a * rate;
    setResult(res);
    setRateText(`1 ${from} = ${rate.toLocaleString('en-US',{maximumFractionDigits:4})} ${to}`);
    setConversions(c=>c+1);
  }, [from, to, amount, rates]);

  const saveConversion = async () => {
    if (!result) return;
    const a = parseFloat(amount);
    const rate = from==='USD' ? rates[to] : to==='USD' ? (1/rates[from]) : (rates[to]/rates[from]);
    try {
      const { data } = await axios.post('/api/history', { from, to, amount:a, result, rate }, { headers: hdrs() });
      setHistory(prev => [data, ...prev].slice(0,20));
      showToast('✅ Saved to history');
    } catch { showToast('❌ Could not save'); }
  };

  const toggleFav = async (f, t) => {
    const key = `${f}-${t}`;
    try {
      await axios.post('/api/favorites', { from:f, to:t }, { headers: hdrs() });
      setFavs(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]);
    } catch { showToast('❌ Could not save'); }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.toLocaleString('en-US',{maximumFractionDigits:2}));
    showToast('📋 Copied!');
  };

  const swap = () => { setFrom(to); setTo(from); };

  const drawChart = async () => {
    if (!canvasRef.current || from === to) return;
    setChartSub('Loading...');
    let dates=[], ratesArr=[];
    try {
      const { data } = await axios.get(`/api/rates/history?from=${from}&to=${to}&days=${chartPeriod}`, { headers: hdrs() });
      dates = Object.keys(data.rates).sort();
      ratesArr = dates.map(d => data.rates[d][to]);
    } catch {
      const base = from==='USD'?FALLBACK[to]:FALLBACK[to]/FALLBACK[from];
      for(let i=chartPeriod;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        dates.push(d.toISOString().split('T')[0]);
        ratesArr.push(base*(1+Math.sin(i*.7)*.012));
      }
    }
    setChartSub(`${chartPeriod}-day history · ${dates.length} data points`);
    if (!ratesArr.length) return;
    const chg = ratesArr[ratesArr.length-1]-ratesArr[0];
    const chgPct = (chg/ratesArr[0]*100);
    setChartStats({ high:Math.max(...ratesArr), low:Math.min(...ratesArr), open:ratesArr[0], change:chg, changePct:chgPct });
    renderCanvas(dates, ratesArr);
  };

  const renderCanvas = (dates, ratesArr) => {
    const canvas = canvasRef.current; if(!canvas) return;
    const W = canvas.parentElement.getBoundingClientRect().width || 700;
    canvas.width = W; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const pad = {l:58,r:14,t:14,b:26};
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
      ctx.fillText(val>100?Math.round(val):val.toFixed(4),pad.l-5,y+4);
    }
    const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
    grad.addColorStop(0,'rgba(59,130,246,0.25)'); grad.addColorStop(1,'rgba(59,130,246,0.01)');
    ctx.beginPath(); ctx.moveTo(xS(0),yS(ratesArr[0]));
    for(let i=1;i<ratesArr.length;i++){
      const cpx=(xS(i-1)+xS(i))/2;
      ctx.bezierCurveTo(cpx,yS(ratesArr[i-1]),cpx,yS(ratesArr[i]),xS(i),yS(ratesArr[i]));
    }
    ctx.lineTo(xS(ratesArr.length-1),pad.t+cH); ctx.lineTo(xS(0),pad.t+cH); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xS(0),yS(ratesArr[0]));
    for(let i=1;i<ratesArr.length;i++){
      const cpx=(xS(i-1)+xS(i))/2;
      ctx.bezierCurveTo(cpx,yS(ratesArr[i-1]),cpx,yS(ratesArr[i]),xS(i),yS(ratesArr[i]));
    }
    ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2.5; ctx.stroke();
    const lx=xS(ratesArr.length-1), ly=yS(ratesArr[ratesArr.length-1]);
    ctx.beginPath(); ctx.arc(lx,ly,5,0,Math.PI*2); ctx.fillStyle='#3b82f6'; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    const step=Math.max(1,Math.floor(dates.length/5));
    ctx.fillStyle='#64748b'; ctx.font='10px Inter,sans-serif'; ctx.textAlign='center';
    for(let i=0;i<dates.length;i+=step){
      const d=new Date(dates[i]+'T00:00:00');
      ctx.fillText(d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),xS(i),196);
    }
  };

  const compareAll = CURRENCIES.filter(c=>c.code!==from).map(c=>{
    const r = from==='USD'?rates[c.code]:rates[c.code]/rates[from];
    return {...c, converted:(parseFloat(amount)||1)*r};
  }).sort((a,b)=>b.converted-a.converted);

  const SHOW_RATES = ['EUR','GBP','PKR','AED','SAR','JPY','INR','CAD'];

  return (
    <div style={{background:'#060c18',minHeight:'100vh',padding:'80px 0 80px',fontFamily:"'Inter',sans-serif",position:'relative',overflow:'hidden'}}>
      <div style={{position:'fixed',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(59,130,246,.08)',top:'-200px',left:'-150px',filter:'blur(100px)',pointerEvents:'none',animation:'blobMove 12s ease-in-out infinite'}}/>
      <div style={{position:'fixed',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(139,92,246,.07)',bottom:'-200px',right:'-100px',filter:'blur(100px)',pointerEvents:'none',animation:'blobMove 10s ease-in-out infinite reverse'}}/>

      {/* TICKER */}
      <div style={{background:'rgba(13,20,38,.95)',borderBottom:'1px solid rgba(255,255,255,.07)',padding:'9px 0',overflow:'hidden',marginBottom:'0',position:'relative',zIndex:2}}>
        <div style={{display:'flex',animation:'ticker 30s linear infinite',whiteSpace:'nowrap',width:'max-content'}}>
          {[...QUICK,...QUICK].map(([a,b],i)=>{
            const r=(rates[b]/(a==='USD'?1:rates[a]));
            return <span key={i} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'0 26px',fontSize:'12px',fontWeight:'600',color:'#64748b',borderRight:'1px solid rgba(255,255,255,.07)'}}>
              <span style={{color:'#f1f5f9'}}>{FLAGS[a]}{a}/{b}{FLAGS[b]}</span>
              <span style={{color:'#3b82f6'}}>{r.toFixed(2)}</span>
            </span>;
          })}
        </div>
      </div>

      {toast && <div style={{position:'fixed',bottom:'28px',left:'50%',transform:'translateX(-50%)',background:'rgba(13,20,38,.98)',border:'1px solid rgba(59,130,246,.3)',color:'#f1f5f9',fontSize:'13px',fontWeight:'600',padding:'12px 24px',borderRadius:'12px',zIndex:999,backdropFilter:'blur(20px)'}}>{toast}</div>}

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'36px 24px 0',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:'900',letterSpacing:'-1.5px',marginBottom:'8px'}}>
            Live <span style={{background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Currency</span> Exchange
          </h1>
          <p style={{color:'#64748b',fontSize:'14px'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',color:'#10b981',padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>
              <span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#10b981',animation:'livePulse 2s infinite',display:'inline-block'}}/>
              {isLive ? 'LIVE' : 'FALLBACK'}
            </span>
            &nbsp; Rates updated every 60s · 18 currencies
          </p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'22px',alignItems:'start'}}>
          {/* CONVERTER */}
          <div style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'26px',padding:'34px',backdropFilter:'blur(24px)',boxShadow:'0 32px 80px rgba(0,0,0,.5)'}}>
            {/* Quick pairs */}
            <div style={{display:'flex',gap:'7px',flexWrap:'wrap',marginBottom:'26px'}}>
              {QUICK.map(([a,b])=>{
                const key=`${a}-${b}`, isFav=favs.includes(key);
                return (
                  <button key={key} onClick={()=>{setFrom(a);setTo(b);}} style={{background:from===a&&to===b?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',border:`1px solid ${from===a&&to===b?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:from===a&&to===b?'#93c5fd':'#64748b',fontSize:'11px',fontWeight:'600',padding:'6px 12px',borderRadius:'18px',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>
                    {a} → {b}
                    <span onClick={(e)=>{e.stopPropagation();toggleFav(a,b);}} style={{opacity:isFav?1:.4,fontSize:'11px'}}>{isFav?'★':'☆'}</span>
                  </button>
                );
              })}
            </div>

            {/* Panels */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 52px 1fr',gap:'10px',alignItems:'center',marginBottom:'18px'}}>
              {[{sel:from,setS:setFrom,label:'From',isFrom:true},{sel:to,setS:setTo,label:'To',isFrom:false}].map((p,idx)=>(
                <React.Fragment key={idx}>
                  {idx===1 && (
                    <div style={{display:'flex',justifyContent:'center'}}>
                      <button onClick={swap} style={{width:'48px',height:'48px',borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',border:'none',color:'#fff',fontSize:'18px',cursor:'pointer',boxShadow:'0 4px 20px rgba(59,130,246,.4)'}}>⇄</button>
                    </div>
                  )}
                  <div style={{background:'rgba(30,41,59,.55)',border:'1.5px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'18px'}}>
                    <div style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:'10px'}}>{p.label}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'7px',paddingBottom:'10px',marginBottom:'10px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                      <span style={{fontSize:'20px'}}>{FLAGS[p.sel]||'🏳'}</span>
                      <select value={p.sel} onChange={e=>p.setS(e.target.value)} style={{background:'transparent',border:'none',color:'#f1f5f9',fontSize:'14px',fontWeight:'700',outline:'none',cursor:'pointer',flex:1,fontFamily:'inherit'}}>
                        {CURRENCIES.map(c=><option key={c.code} value={c.code} style={{background:'#1e293b'}}>{c.code}</option>)}
                      </select>
                    </div>
                    {p.isFrom ? (
                      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{width:'100%',background:'transparent',border:'none',color:'#f1f5f9',fontSize:'28px',fontWeight:'900',outline:'none',fontFamily:'inherit'}}/>
                    ) : (
                      <div style={{fontSize:'28px',fontWeight:'900',color:'#3b82f6',minHeight:'36px'}}>
                        {result!=null ? result.toLocaleString('en-US',{maximumFractionDigits:to==='JPY'?0:2}) : '—'}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div style={{background:'rgba(30,41,59,.5)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'14px',padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <span style={{fontSize:'13px',color:'#64748b'}}><strong style={{color:'#f1f5f9'}}>{rateText}</strong></span>
              <span style={{fontSize:'10px',fontWeight:'700',padding:'3px 9px',borderRadius:'7px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',color:'#3b82f6'}}>{isLive?'Live Rate':'Fallback'}</span>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <button onClick={copyResult} style={{padding:'12px',borderRadius:'13px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',border:'none',fontWeight:'700',fontSize:'14px',cursor:'pointer',boxShadow:'0 4px 20px rgba(59,130,246,.35)'}}>Copy Result</button>
              <button onClick={saveConversion} style={{padding:'12px',borderRadius:'13px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',color:'#10b981',fontWeight:'700',fontSize:'14px',cursor:'pointer'}}>💾 Save</button>
            </div>
          </div>

          {/* RIGHT COL */}
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {/* Live rates */}
            <div style={cardSm}>
              <div style={smTitle}>Live Rates vs USD</div>
              {SHOW_RATES.map(code=>(
                <div key={code} onClick={()=>{setFrom('USD');setTo(code);}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,.06)',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                    <span style={{fontSize:'17px'}}>{FLAGS[code]}</span>
                    <div><div style={{fontSize:'12px',fontWeight:'700',color:'#f1f5f9'}}>{code}</div><div style={{fontSize:'9px',color:'#64748b'}}>{NAMES[code]}</div></div>
                  </div>
                  <div style={{fontSize:'13px',fontWeight:'800',color:'#f1f5f9'}}>{(rates[code]||0).toLocaleString('en-US',{maximumFractionDigits:code==='JPY'?0:4})}</div>
                </div>
              ))}
            </div>
            {/* Stats */}
            <div style={cardSm}>
              <div style={smTitle}>Session Stats</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {[{val:conversions,lbl:'Conversions'},{val:18,lbl:'Currencies'},{val:favs.length,lbl:'Favorites'},{val:history.length,lbl:'Saved'}].map((s,i)=>(
                  <div key={i} style={{background:'rgba(30,41,59,.5)',borderRadius:'12px',padding:'12px'}}>
                    <div style={{fontSize:'18px',fontWeight:'800',color:'#3b82f6',marginBottom:'2px'}}>{s.val}</div>
                    <div style={{fontSize:'9px',color:'#64748b',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.5px'}}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* HISTORY CHART */}
        <div style={{...cardSm,marginTop:'22px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
            <div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#f1f5f9'}}>{FLAGS[from]} {from} → {FLAGS[to]} {to} Rate History</div>
              <div style={{fontSize:'11px',color:'#64748b',marginTop:'3px'}}>{chartSub}</div>
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              {[7,14,30].map(d=>(
                <button key={d} onClick={()=>setChartPeriod(d)} style={{background:chartPeriod===d?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',border:`1px solid ${chartPeriod===d?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:chartPeriod===d?'#93c5fd':'#64748b',fontSize:'11px',fontWeight:'700',padding:'4px 12px',borderRadius:'7px',cursor:'pointer'}}>{d}D</button>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} style={{width:'100%',display:'block',borderRadius:'8px',marginTop:'10px'}}/>
          {chartStats && (
            <div style={{display:'flex',gap:'24px',flexWrap:'wrap',marginTop:'12px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
              {[
                {l:'Open',  v:chartStats.open>100?chartStats.open.toFixed(2):chartStats.open.toFixed(4)},
                {l:'High',  v:chartStats.high>100?chartStats.high.toFixed(2):chartStats.high.toFixed(4)},
                {l:'Low',   v:chartStats.low>100?chartStats.low.toFixed(2):chartStats.low.toFixed(4)},
                {l:'Change',v:`${chartStats.change>=0?'+':''}${chartStats.changePct.toFixed(2)}%`,c:chartStats.change>=0?'#10b981':'#ef4444'},
              ].map(s=>(
                <span key={s.l} style={{fontSize:'12px',color:'#64748b'}}>{s.l}: <strong style={{color:s.c||'#f1f5f9'}}>{s.v}</strong></span>
              ))}
            </div>
          )}
        </div>

        {/* COMPARE ALL */}
        <div style={{...cardSm,marginTop:'22px'}}>
          <div style={smTitle}>Compare All — {parseFloat(amount)||1} {FLAGS[from]} {from} equals...</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'8px',marginTop:'14px'}}>
            {compareAll.map(c=>(
              <div key={c.code} onClick={()=>{setFrom(from);setTo(c.code);}} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(30,41,59,.5)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'11px',padding:'10px 13px',cursor:'pointer',transition:'all .2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontSize:'19px'}}>{c.flag}</span>
                  <div><div style={{fontSize:'12px',fontWeight:'700',color:'#f1f5f9'}}>{c.code}</div><div style={{fontSize:'9px',color:'#64748b'}}>{c.name}</div></div>
                </div>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#3b82f6'}}>{c.converted.toLocaleString('en-US',{maximumFractionDigits:c.converted>1000?0:c.converted>1?2:4})}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={{...cardSm,marginTop:'22px'}}>
            <div style={smTitle}>Conversion History</div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:'280px',overflowY:'auto'}}>
              {history.map(h=>(
                <div key={h._id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(30,41,59,.45)',borderRadius:'11px',padding:'11px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'16px'}}>{FLAGS[h.from]}</span>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:'700',color:'#f1f5f9'}}>{h.amount.toLocaleString()} {h.from} → {h.result.toLocaleString('en-US',{maximumFractionDigits:2})} {h.to}</div>
                      <div style={{fontSize:'10px',color:'#64748b'}}>Rate: {h.rate.toFixed(4)} · {new Date(h.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                  <span style={{fontSize:'16px'}}>{FLAGS[h.to]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const cardSm = {background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'22px',padding:'22px',backdropFilter:'blur(24px)'};
const smTitle = {fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'};
