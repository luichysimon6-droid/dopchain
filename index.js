import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { fmt, apiFetch } from '../lib/utils'

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const S = { // shared inline styles
  card: { background:'#fff', borderRadius:16, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)' },
  darkCard: { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:16 },
  input: { width:'100%', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'12px 16px', color:'#fff', fontSize:15, outline:'none', boxSizing:'border-box', marginBottom:14 },
  label: { display:'block', fontSize:11, color:'#4a7fc1', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  btn: (bg) => ({ width:'100%', background:bg, border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:"'Nunito'" }),
  ghostBtn: { background:'transparent', border:'1px solid rgba(255,255,255,.15)', borderRadius:12, padding:'12px', color:'#888', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito'" },
}

function Spinner({ small }) {
  const s = small ? 20 : 40
  return <div style={{ width:s, height:s, border:`3px solid rgba(0,114,255,.25)`, borderTop:'3px solid #0072ff', borderRadius:'50%', animation:'spin .7s linear infinite', margin: small ? '0' : '80px auto' }} />
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', zIndex:999, background: type==='error'?'#c0392b':'#1bc47d', color:'#fff', borderRadius:12, padding:'12px 24px', fontWeight:800, fontSize:14, boxShadow:'0 4px 20px rgba(0,0,0,.4)', animation:'fadeUp .25s ease', whiteSpace:'nowrap' }}>
      {type==='error'?'✗':'✓'} {msg}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#0d1a3a', border:'1px solid rgba(255,255,255,.1)', borderRadius:'24px 24px 0 0', padding:28, width:'100%', maxWidth:500, animation:'slideUp .25s ease', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ width:40, height:4, background:'rgba(255,255,255,.15)', borderRadius:2, margin:'0 auto 20px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontWeight:800, fontSize:18 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = { pending:{bg:'#fff3cd',color:'#856404',label:'Pendiente'}, approved:{bg:'#d1f5e0',color:'#1a7a4a',label:'Aprobado'}, rejected:{bg:'#fde8e8',color:'#c0392b',label:'Rechazado'}, completed:{bg:'#d1f5e0',color:'#1a7a4a',label:'Completado'} }
  const c = cfg[status]||cfg.pending
  return <span style={{ background:c.bg, color:c.color, borderRadius:6, padding:'2px 10px', fontSize:11, fontWeight:800 }}>{c.label}</span>
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [err,setErr]=useState(''); const [loading,setLoading]=useState(false)
  const handle = async () => {
    if(!email||!pass){setErr('Completa todos los campos');return}
    setLoading(true);setErr('')
    try{const d=await apiFetch('/api/login',{method:'POST',body:{email,password:pass}});localStorage.setItem('dopchain_token',d.token);onLogin(d.user)}
    catch(e){setErr(e.message)}
    setLoading(false)
  }
  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 50% 0%,rgba(0,114,255,.2) 0%,transparent 60%),#0a0f1e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#00c6ff,#0072ff)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:36, boxShadow:'0 8px 32px rgba(0,114,255,.4)' }}>⛓️</div>
        <h1 style={{ fontFamily:"'Bebas Neue'", fontSize:38, letterSpacing:4 }}>DOPCHAIN</h1>
        <p style={{ color:'#4a7fc1', fontSize:13, marginTop:4 }}>Plataforma Financiera · DOP</p>
      </div>
      <div style={{ width:'100%', maxWidth:380, ...S.darkCard }}>
        <label style={S.label}>Correo electrónico</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="tu@correo.do" style={S.input} />
        <label style={S.label}>Contraseña</label>
        <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" style={S.input} onKeyDown={e=>e.key==='Enter'&&handle()} />
        {err&&<p style={{ color:'#f87171', fontSize:13, textAlign:'center', marginBottom:12 }}>{err}</p>}
        <button onClick={handle} disabled={loading} style={S.btn('linear-gradient(135deg,#0072ff,#00c6ff)')}>
          {loading?<span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Spinner small/>Ingresando…</span>:'Ingresar →'}
        </button>
      </div>
    </div>
  )
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ user }) {
  return (
    <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(10,15,30,.97)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#0072ff,#00c6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>⛓️</div>
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:2 }}>DOPCHAIN</span>
      </div>
      <div style={{ background:'rgba(0,114,255,.15)', border:'1px solid rgba(0,198,255,.25)', borderRadius:20, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:11, color:'#00c6ff' }}>⚡</span>
        <span style={{ fontFamily:"'Bebas Neue'", fontSize:16, letterSpacing:1 }}>{fmt(user?.balance)}</span>
      </div>
    </div>
  )
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({ user, onRefresh, showToast }) {
  const [matches,setMatches]=useState([]); const [betModal,setBetModal]=useState(null); const [betTeam,setBetTeam]=useState(null); const [betAmt,setBetAmt]=useState(''); const [loading,setLoading]=useState(false); const [result,setResult]=useState(null); const [hasBetToday,setHasBetToday]=useState(false)

  useEffect(()=>{
    apiFetch('/api/matches').then(setMatches).catch(()=>{})
    apiFetch('/api/bets').then(bets=>{
      const today=new Date().toISOString().slice(0,10)
      setHasBetToday(bets.some(b=>b.created_at?.slice(0,10)===today))
    }).catch(()=>{})
  },[])

  const placeBet = async () => {
    const amt=parseFloat(betAmt); if(!amt||amt<=0){showToast('Monto inválido','error');return}
    if(!betTeam){showToast('Selecciona un equipo','error');return}
    setLoading(true)
    try{
      const d=await apiFetch('/api/bets',{method:'POST',body:{match_id:betModal.id,team:betTeam,amount:amt}})
      setResult(d); setHasBetToday(true); onRefresh(); setBetModal(null); setBetAmt(''); setBetTeam(null)
    }catch(e){showToast(e.message,'error')}
    setLoading(false)
  }

  return (
    <div style={{ padding:'20px 16px', paddingBottom:90 }}>
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,#0d2a6e,#0a1f4e)', border:'1px solid rgba(0,114,255,.2)', borderRadius:20, padding:20, marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(0,198,255,.07)' }} />
        <p style={{ color:'#4a9eff', fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Bienvenido</p>
        <h2 style={{ fontSize:26, fontWeight:900, margin:'4px 0 2px' }}>{user?.name} <span style={{ background:'rgba(255,215,0,.15)', color:'#ffd700', border:'1px solid rgba(255,215,0,.3)', borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>{user?.vip}</span></h2>
        <p style={{ color:'#4a7fc1', fontSize:13 }}>Saldo: <strong style={{ color:'#00c6ff' }}>{fmt(user?.balance)}</strong></p>
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button onClick={()=>document.getElementById('recharge-trigger')?.click()} style={{ flex:1, background:'linear-gradient(135deg,#0072ff,#00c6ff)', border:'none', borderRadius:10, padding:'10px', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>＋ Recargar</button>
          <button onClick={()=>document.getElementById('withdraw-trigger')?.click()} style={{ flex:1, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'10px', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>↓ Retirar</button>
        </div>
      </div>

      {/* Bet result */}
      {result&&(
        <div onClick={()=>setResult(null)} style={{ background:result.won?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)', border:`1px solid ${result.won?'rgba(74,222,128,.3)':'rgba(248,113,113,.3)'}`, borderRadius:16, padding:16, marginBottom:20, textAlign:'center', cursor:'pointer', animation:'fadeUp .3s ease' }}>
          <div style={{ fontSize:36 }}>{result.won?'🎉':'😔'}</div>
          <p style={{ fontWeight:800, fontSize:18, color:result.won?'#4ade80':'#f87171', margin:'8px 0 4px' }}>{result.won?`¡GANASTE ${fmt(result.gain)}!`:`Perdiste ${fmt(result.bet?.amount)}`}</p>
          <p style={{ color:'#666', fontSize:12 }}>Toca para cerrar</p>
        </div>
      )}

      {/* Matches */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <h3 style={{ fontSize:16, fontWeight:800 }}>⚽ Partidos disponibles</h3>
        <span style={{ background:'rgba(0,198,255,.1)', color:'#00c6ff', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, animation:'pulse 2s infinite' }}>● EN VIVO</span>
      </div>

      {matches.length===0?<div style={{ textAlign:'center', padding:40, color:'#4a7fc1' }}><Spinner/><p style={{ marginTop:16 }}>Cargando partidos…</p></div>
      :matches.filter(m=>m.status!=='finished').map(m=>(
        <div key={m.id} style={{ ...S.darkCard, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:11, color:'#4a7fc1', fontWeight:700 }}>🕐 {m.match_time} · {m.match_date===new Date().toISOString().slice(0,10)?'Hoy':m.match_date}</span>
            <span style={{ background:m.status==='live'?'rgba(239,68,68,.15)':'rgba(16,185,129,.1)', color:m.status==='live'?'#f87171':'#4ade80', border:`1px solid ${m.status==='live'?'rgba(248,113,113,.2)':'rgba(74,222,128,.2)'}`, borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700 }}>{m.status==='live'?'🔴 EN VIVO':'PRÓXIMO'}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:32, marginBottom:4 }}>{m.home_logo}</div>
              <p style={{ fontSize:11, fontWeight:800, color:'#e0e0ff' }}>{m.home_team.split(' ')[0]}</p>
            </div>
            <div style={{ textAlign:'center', padding:'0 12px' }}>
              <div style={{ background:'rgba(255,255,255,.05)', borderRadius:10, padding:'6px 14px' }}>
                <span style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:2 }}>VS</span>
              </div>
            </div>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:32, marginBottom:4 }}>{m.away_logo}</div>
              <p style={{ fontSize:11, fontWeight:800, color:'#e0e0ff' }}>{m.away_team.split(' ')[0]}</p>
            </div>
          </div>
          {hasBetToday
            ?<div style={{ marginTop:12, textAlign:'center', color:'#4a7fc1', fontSize:12, fontWeight:600 }}>✓ Ya apostaste hoy</div>
            :<button onClick={()=>{setBetModal(m);setBetTeam(null)}} style={{ ...S.btn('linear-gradient(135deg,#0072ff,#00c6ff)'), marginTop:14 }}>Apostar ahora 🎲</button>
          }
        </div>
      ))}

      {/* Bet Modal */}
      {betModal&&(
        <Modal title="Realizar Apuesta 🎲" onClose={()=>{setBetModal(null);setBetAmt('');setBetTeam(null)}}>
          <p style={{ color:'#4a7fc1', fontSize:13, marginBottom:16 }}>{betModal.home_team} vs {betModal.away_team}</p>
          <label style={S.label}>¿A qué equipo le apuestas?</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {[{name:betModal.home_team,logo:betModal.home_logo},{name:betModal.away_team,logo:betModal.away_logo}].map(t=>(
              <button key={t.name} onClick={()=>setBetTeam(t.name)} style={{ background:betTeam===t.name?'rgba(0,114,255,.2)':'rgba(255,255,255,.04)', border:`2px solid ${betTeam===t.name?'#0072ff':'rgba(255,255,255,.1)'}`, borderRadius:12, padding:14, cursor:'pointer', color:'#fff', textAlign:'center', transition:'all .2s' }}>
                <div style={{ fontSize:26 }}>{t.logo}</div>
                <p style={{ fontSize:12, fontWeight:800, marginTop:6, color:betTeam===t.name?'#00c6ff':'#aaa' }}>{t.name.split(' ')[0]}</p>
              </button>
            ))}
          </div>
          <label style={S.label}>Monto a apostar · Saldo: {fmt(user?.balance)}</label>
          <input value={betAmt} onChange={e=>setBetAmt(e.target.value)} type="number" placeholder="RD$ 500" style={S.input} />
          <p style={{ color:'#4a7fc1', fontSize:12, textAlign:'center', marginBottom:16 }}>Ganancia si aciertas: ×1.8 · Solo 1 apuesta por día</p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setBetModal(null);setBetAmt('');setBetTeam(null)}} style={{ ...S.ghostBtn, flex:1 }}>Cancelar</button>
            <button onClick={placeBet} disabled={loading||!betTeam||!betAmt} style={{ ...S.btn('linear-gradient(135deg,#0072ff,#00c6ff)'), flex:2, opacity:(!betTeam||!betAmt||loading)?0.5:1 }}>
              {loading?<span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Spinner small/>Procesando…</span>:'Confirmar ✓'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── RECHARGE MODAL ───────────────────────────────────────────────────────────
function RechargeModal({ onClose, onDone, showToast }) {
  const [form,setForm]=useState({amount:'',bank_name:'',ref_number:''}); const [loading,setLoading]=useState(false)
  const submit = async () => {
    if(!form.amount||!form.bank_name||!form.ref_number){showToast('Completa todos los campos','error');return}
    setLoading(true)
    try{await apiFetch('/api/recharge',{method:'POST',body:{...form,amount:parseFloat(form.amount)}});showToast('Solicitud enviada, esperando aprobación');onDone();onClose()}
    catch(e){showToast(e.message,'error')}
    setLoading(false)
  }
  return (
    <Modal title="💳 Solicitar Recarga" onClose={onClose}>
      <div style={{ background:'rgba(0,114,255,.08)', border:'1px solid rgba(0,114,255,.2)', borderRadius:12, padding:14, marginBottom:20 }}>
        <p style={{ fontSize:12, color:'#4a9eff', fontWeight:700, marginBottom:6 }}>📋 Instrucciones</p>
        <p style={{ fontSize:13, color:'#8ab4d8', lineHeight:1.5 }}>1. Realiza la transferencia bancaria<br/>2. Llena el formulario con los datos<br/>3. El admin aprobará en menos de 24h</p>
      </div>
      <label style={S.label}>Monto (DOP)</label>
      <input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} type="number" placeholder="RD$ 1,000" style={S.input}/>
      <label style={S.label}>Banco origen</label>
      <select value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})} style={{...S.input, appearance:'none'}}>
        <option value="">Seleccionar banco…</option>
        {['Banco Popular','BanReservas','Scotiabank','Banco BHD','Banco Santa Cruz','Banco Caribe','Asociación Popular','Otro'].map(b=><option key={b}>{b}</option>)}
      </select>
      <label style={S.label}>Número de referencia / confirmación</label>
      <input value={form.ref_number} onChange={e=>setForm({...form,ref_number:e.target.value})} placeholder="Ej: TRF-20240501-001" style={S.input}/>
      <div style={{ display:'flex', gap:10, marginTop:4 }}>
        <button onClick={onClose} style={{...S.ghostBtn,flex:1}}>Cancelar</button>
        <button onClick={submit} disabled={loading} style={{...S.btn('linear-gradient(135deg,#059669,#10b981)'),flex:2,opacity:loading?.5:1}}>
          {loading?'Enviando…':'Enviar Solicitud ✓'}
        </button>
      </div>
    </Modal>
  )
}

// ─── WITHDRAW MODAL ───────────────────────────────────────────────────────────
function WithdrawModal({ user, onClose, onDone, showToast }) {
  const [form,setForm]=useState({amount:'',bank_name:'',account_number:'',account_name:''}); const [loading,setLoading]=useState(false)
  const submit = async () => {
    if(!form.amount||!form.bank_name||!form.account_number||!form.account_name){showToast('Completa todos los campos','error');return}
    if(parseFloat(form.amount)>user.balance){showToast('Saldo insuficiente','error');return}
    setLoading(true)
    try{await apiFetch('/api/withdraw',{method:'POST',body:{...form,amount:parseFloat(form.amount)}});showToast('Solicitud enviada, el admin la procesará pronto');onDone();onClose()}
    catch(e){showToast(e.message,'error')}
    setLoading(false)
  }
  return (
    <Modal title="💸 Solicitar Retiro" onClose={onClose}>
      <p style={{ color:'#4a7fc1', fontSize:13, marginBottom:16 }}>Saldo disponible: <strong style={{ color:'#00c6ff' }}>{fmt(user?.balance)}</strong></p>
      <label style={S.label}>Monto a retirar (DOP)</label>
      <input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} type="number" placeholder="RD$ 500" style={S.input}/>
      <label style={S.label}>Banco destino</label>
      <select value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})} style={{...S.input,appearance:'none'}}>
        <option value="">Seleccionar banco…</option>
        {['Banco Popular','BanReservas','Scotiabank','Banco BHD','Banco Santa Cruz','Banco Caribe','Asociación Popular','Otro'].map(b=><option key={b}>{b}</option>)}
      </select>
      <label style={S.label}>Número de cuenta</label>
      <input value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value})} placeholder="Ej: 000-000000-0" style={S.input}/>
      <label style={S.label}>Nombre del titular</label>
      <input value={form.account_name} onChange={e=>setForm({...form,account_name:e.target.value})} placeholder="Nombre completo" style={S.input}/>
      <div style={{ display:'flex', gap:10, marginTop:4 }}>
        <button onClick={onClose} style={{...S.ghostBtn,flex:1}}>Cancelar</button>
        <button onClick={submit} disabled={loading} style={{...S.btn('linear-gradient(135deg,#b91c1c,#ef4444)'),flex:2,opacity:loading?.5:1}}>
          {loading?'Enviando…':'Solicitar Retiro ✓'}
        </button>
      </div>
    </Modal>
  )
}

// ─── TEAM TAB ─────────────────────────────────────────────────────────────────
function TeamTab({ user, showToast }) {
  const [data,setData]=useState(null); const [copied,setCopied]=useState('')
  useEffect(()=>{ apiFetch('/api/team').then(setData).catch(()=>{}) },[])
  const copy=(text,key)=>{ navigator.clipboard?.writeText(text).catch(()=>{}); setCopied(key); setTimeout(()=>setCopied(''),2000) }
  const refLink = `dopchain.vercel.app/ref/${data?.refCode||''}`

  if(!data) return <div style={{ padding:20, paddingBottom:90 }}><Spinner/></div>
  const { stats, members } = data
  const allMembers=[...(members.lv1||[]),...(members.lv2||[]),...(members.lv3||[])]

  return (
    <div style={{ background:'#f2f4f8', minHeight:'100vh', paddingBottom:90 }}>
      {/* Summary card */}
      <div style={{ ...S.card, margin:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, paddingBottom:12, borderBottom:'1px dashed #e0e8f0' }}>
          <div><p style={{ color:'#888', fontSize:13 }}>¡Hola!</p><p style={{ fontWeight:800, fontSize:15, color:'#222' }}>Líder de equipo</p></div>
          <span style={{ color:'#1a7aff', fontWeight:700, fontSize:13 }}>Resumen de ingresos ›</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p style={{ fontWeight:800, fontSize:15, color:'#222' }}>Resumen del equipo</p>
          <span style={{ fontSize:18 }}>📋</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', marginBottom:14 }}>
          <div><p style={{ fontSize:12, color:'#999', marginBottom:2 }}>Ingresos totales</p><p style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:'#1bc47d', letterSpacing:1 }}>{fmt(stats.totalIncome)}</p></div>
          <div><p style={{ fontSize:12, color:'#999', marginBottom:2 }}>Ganancias de hoy</p><p style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:'#1bc47d', letterSpacing:1 }}>{fmt(stats.todayGain)}</p></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
          {[{label:'Equipo agregado',val:stats.total,bg:'linear-gradient(135deg,#e8534a,#f07070)'},{label:'Nuevos hoy',val:stats.newToday,bg:'linear-gradient(135deg,#7b6cf6,#a78bfa)'},{label:'Subordinados',val:allMembers.length,bg:'linear-gradient(135deg,#2ecead,#4adecd)'}].map(c=>(
            <div key={c.label} style={{ background:c.bg, borderRadius:12, padding:'12px 10px' }}>
              <p style={{ fontSize:9, color:'rgba(255,255,255,.85)', marginBottom:4, fontWeight:600 }}>{c.label}</p>
              <p style={{ fontFamily:"'Bebas Neue'", fontSize:26, color:'#fff', letterSpacing:1, margin:0 }}>{c.val}</p>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[{label:'Recargas totales',val:fmt(stats.totalRecharges),bg:'linear-gradient(135deg,#4caf7d,#6dcf9e)'},{label:'Retiros totales',val:fmt(stats.totalWithdrawals),bg:'linear-gradient(135deg,#d962c8,#e88de0)'},{label:'Apuestas totales',val:fmt(stats.totalBets),bg:'linear-gradient(135deg,#f09a3a,#f5b96a)'}].map(c=>(
            <div key={c.label} style={{ background:c.bg, borderRadius:12, padding:'12px 10px' }}>
              <p style={{ fontSize:9, color:'rgba(255,255,255,.85)', marginBottom:4, fontWeight:600 }}>{c.label}</p>
              <p style={{ fontFamily:"'Bebas Neue'", fontSize:15, color:'#fff', letterSpacing:.5, margin:0 }}>{c.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div style={{ ...S.card, margin:'0 12px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p style={{ fontWeight:800, fontSize:15, color:'#222' }}>Niveles</p>
          <span style={{ color:'#1a7aff', fontWeight:700, fontSize:13 }}>Ver detalles ›</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[{lv:'LV 1',count:members.lv1.length,color:'#1bc47d',bg:'#e8faf3'},{lv:'LV 2',count:members.lv2.length,color:'#e8534a',bg:'#fef0ef'},{lv:'LV 3',count:members.lv3.length,color:'#f09a3a',bg:'#fef6ec'}].map(l=>(
              <div key={l.lv} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ background:l.bg, color:l.color, borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:800 }}>{l.lv}</span>
                <span style={{ fontSize:13, color:'#555', fontWeight:600 }}>{l.count} Miembros</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            {allMembers.length===0?<p style={{ color:'#bbb', fontSize:13, textAlign:'center' }}>Sin datos aún</p>:(
              <div style={{ width:80, height:80, position:'relative' }}>
                <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)', width:'100%', height:'100%' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f0f0f0" strokeWidth="4"/>
                  {members.lv1.length>0&&<circle cx="18" cy="18" r="14" fill="none" stroke="#1bc47d" strokeWidth="4" strokeDasharray={`${(members.lv1.length/allMembers.length)*88} 88`}/>}
                  {members.lv2.length>0&&<circle cx="18" cy="18" r="14" fill="none" stroke="#e8534a" strokeWidth="4" strokeDasharray={`${(members.lv2.length/allMembers.length)*88} 88`} strokeDashoffset={`-${(members.lv1.length/allMembers.length)*88}`}/>}
                  {members.lv3.length>0&&<circle cx="18" cy="18" r="14" fill="none" stroke="#f09a3a" strokeWidth="4" strokeDasharray={`${(members.lv3.length/allMembers.length)*88} 88`} strokeDashoffset={`-${((members.lv1.length+members.lv2.length)/allMembers.length)*88}`}/>}
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:'#222' }}>{allMembers.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ ...S.card, margin:'0 12px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p style={{ fontWeight:800, fontSize:15, color:'#222' }}>Miembros</p>
          <span style={{ color:'#1a7aff', fontWeight:700, fontSize:13 }}>Ver todo ›</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr', borderBottom:'1px solid #f0f0f0', paddingBottom:8, marginBottom:8 }}>
          {['Usuario','Inversión','Nivel'].map(h=><p key={h} style={{ fontSize:12, color:'#aaa', fontWeight:700 }}>{h}</p>)}
        </div>
        {allMembers.length===0?<p style={{ textAlign:'center', color:'#bbb', fontSize:13, padding:'16px 0' }}>Sin miembros aún. Comparte tu enlace.</p>
        :allMembers.slice(0,10).map(m=>(
          <div key={m.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr', padding:'10px 0', borderBottom:'1px solid #f8f8f8', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0072ff,#00c6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>{m.name[0]}</div>
              <span style={{ fontSize:12, fontWeight:700, color:'#333' }}>{m.name.split(' ')[0]}</span>
            </div>
            <p style={{ fontSize:12, fontWeight:700, color:'#1bc47d' }}>{fmt(m.balance)}</p>
            <span style={{ background:m.level===1?'#e8faf3':m.level===2?'#fef0ef':'#fef6ec', color:m.level===1?'#1bc47d':m.level===2?'#e8534a':'#f09a3a', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:800, textAlign:'center', display:'inline-block' }}>LV{m.level}</span>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div style={{ background:'#1a2440', margin:'0 12px 12px', borderRadius:16, padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div style={{ background:'rgba(255,255,255,.06)', borderRadius:10, padding:'10px 12px' }}>
            <p style={{ fontSize:10, color:'#8899bb', marginBottom:4, fontWeight:600 }}>Tu enlace</p>
            <p style={{ fontSize:11, color:'#a0b4d0', fontWeight:600, wordBreak:'break-all' }}>{refLink}</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.06)', borderRadius:10, padding:'10px 12px' }}>
            <p style={{ fontSize:10, color:'#8899bb', marginBottom:4, fontWeight:600 }}>Código</p>
            <p style={{ fontSize:14, color:'#fff', fontWeight:800, letterSpacing:1 }}>{data.refCode}</p>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={()=>copy(refLink,'link')} style={S.btn('#1a7aff')}>{copied==='link'?'✓ Copiado!':'Copiar enlace'}</button>
          <button onClick={()=>copy(data.refCode,'code')} style={S.btn('#1a7aff')}>{copied==='code'?'✓ Copiado!':'Copiar código'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── BETS TAB ─────────────────────────────────────────────────────────────────
function BetsTab() {
  const [bets,setBets]=useState(null)
  useEffect(()=>{ apiFetch('/api/bets').then(setBets).catch(()=>setBets([])) },[])
  if(!bets) return <div style={{ padding:20, paddingBottom:90 }}><Spinner/></div>
  const won=bets.filter(b=>b.result==='win').length, lost=bets.filter(b=>b.result==='loss').length
  const netGain=bets.reduce((a,b)=>a+(b.result==='win'?b.gain:b.result==='loss'?-b.amount:0),0)
  return (
    <div style={{ padding:'20px 16px', paddingBottom:90 }}>
      <h2 style={{ fontSize:20, fontWeight:900, marginBottom:20 }}>Mis Apuestas</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {[{label:'Ganadas',val:won,color:'#4ade80'},{label:'Perdidas',val:lost,color:'#f87171'},{label:'Balance',val:netGain>=0?`+${fmt(netGain)}`:fmt(netGain),color:netGain>=0?'#4ade80':'#f87171'}].map(s=>(
          <div key={s.label} style={{ ...S.darkCard, padding:'14px 10px', textAlign:'center' }}>
            <p style={{ fontFamily:"'Bebas Neue'", fontSize:s.label==='Balance'?13:28, color:s.color, margin:0, letterSpacing:1 }}>{s.val}</p>
            <p style={{ fontSize:10, color:'#4a7fc1', fontWeight:700, marginTop:3, letterSpacing:.5 }}>{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>
      {bets.length===0?<div style={{ textAlign:'center', padding:48, color:'#4a7fc1' }}><div style={{ fontSize:40, marginBottom:12 }}>🎲</div><p style={{ fontWeight:700 }}>Sin apuestas aún</p><p style={{ fontSize:13, marginTop:4 }}>Ve a Inicio y realiza tu primera apuesta</p></div>
      :bets.map(b=>(
        <div key={b.id} style={{ ...S.darkCard, marginBottom:10, borderColor:b.result==='win'?'rgba(74,222,128,.15)':b.result==='loss'?'rgba(248,113,113,.15)':'rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ marginBottom:6 }}>
                <StatusBadge status={b.result==='win'?'approved':b.result==='loss'?'rejected':b.result} />
              </div>
              <p style={{ fontWeight:800, fontSize:14, marginBottom:2 }}>{b.matches?.home_team} vs {b.matches?.away_team}</p>
              <p style={{ fontSize:12, color:'#4a7fc1' }}>Aposté a: <strong style={{ color:'#e0e0ff' }}>{b.team}</strong></p>
              <p style={{ fontSize:11, color:'#2a4a7a', marginTop:4 }}>{b.created_at?.slice(0,10)}</p>
            </div>
            <div style={{ textAlign:'right', marginLeft:12 }}>
              <p style={{ fontSize:12, color:'#4a7fc1', marginBottom:2 }}>Apostado</p>
              <p style={{ fontFamily:"'Bebas Neue'", fontSize:18, letterSpacing:1 }}>{fmt(b.amount)}</p>
              {b.result!=='pending'&&<><p style={{ fontSize:11, color:'#4a7fc1', marginTop:4 }}>{b.result==='win'?'Ganancia':'Pérdida'}</p><p style={{ fontFamily:"'Bebas Neue'", fontSize:16, color:b.result==='win'?'#4ade80':'#f87171', letterSpacing:1 }}>{b.result==='win'?'+':'-'}{fmt(b.result==='win'?b.gain:b.amount)}</p></>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab({ user, onLogout, showToast, onRefresh }) {
  const [avatar,setAvatar]=useState(user?.avatar_url||null)
  const [rechargeModal,setRechargeModal]=useState(false)
  const [withdrawModal,setWithdrawModal]=useState(false)
  const [requests,setRequests]=useState({recharges:[],withdrawals:[]})

  useEffect(()=>{
    Promise.all([apiFetch('/api/recharge'),apiFetch('/api/withdraw')]).then(([r,w])=>setRequests({recharges:r,withdrawals:w})).catch(()=>{})
  },[])

  const handleAvatar=(e)=>{ const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setAvatar(ev.target.result); r.readAsDataURL(f) }

  const menuItems=[
    {icon:'🏠',label:'Página Principal',sub:'Ir al inicio'},
    {icon:'👑',label:'VIP',sub:`Nivel actual: ${user?.vip}`},
    {icon:'👥',label:'Centro de Agentes',sub:'Gestiona tus referidos'},
    {icon:'🎉',label:'Sala de Eventos',sub:'Torneos y promociones'},
  ]
  const accountItems=[
    {icon:'⚙️',label:'Configuración',sub:'Ajustes de cuenta'},
    {icon:'💳',label:'Gestión de Tarjetas',sub:'Métodos de pago'},
    {icon:'📊',label:'Registros Financieros',sub:'Historial de movimientos'},
    {icon:'🎲',label:'Récords de apuestas',sub:'Ver historial completo'},
  ]

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#0a1f4e,#0d2a6e)', padding:'28px 16px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, width:140, height:140, borderRadius:'0 0 0 140px', background:'rgba(0,198,255,.06)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:70, height:70, borderRadius:'50%', background:avatar?'transparent':'linear-gradient(135deg,#0072ff,#00c6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:avatar?0:26, fontWeight:900, border:'3px solid rgba(0,198,255,.4)', overflow:'hidden' }}>
              {avatar?<img src={avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:user?.name?.[0]}
            </div>
            <label htmlFor="av" style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'#0072ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid #0a1f4e', fontSize:10 }}>📷</label>
            <input id="av" type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }}/>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <h2 style={{ fontSize:22, fontWeight:900 }}>{user?.name}</h2>
              <span style={{ background:'rgba(255,215,0,.15)', color:'#ffd700', border:'1px solid rgba(255,215,0,.3)', borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>🔑 {user?.vip}</span>
            </div>
            <p style={{ color:'#4a7fc1', fontSize:13 }}>{user?.email}</p>
            <p style={{ color:'#2a4a7a', fontSize:11, marginTop:2 }}>Miembro desde {user?.created_at?.slice(0,10)}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'16px 16px 0' }}>
        <button onClick={()=>setRechargeModal(true)} style={{ background:'linear-gradient(135deg,#059669,#10b981)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>＋ Recargar</button>
        <button onClick={()=>setWithdrawModal(true)} style={{ background:'linear-gradient(135deg,#b91c1c,#ef4444)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>↓ Retirar</button>
      </div>

      {/* Pending requests */}
      {(requests.recharges.filter(r=>r.status==='pending').length>0||requests.withdrawals.filter(w=>w.status==='pending').length>0)&&(
        <div style={{ margin:'14px 16px 0', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:14, padding:14 }}>
          <p style={{ fontSize:12, color:'#f59e0b', fontWeight:700, marginBottom:8 }}>⏳ Solicitudes pendientes</p>
          {requests.recharges.filter(r=>r.status==='pending').map(r=>(
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(245,158,11,.1)' }}>
              <span style={{ fontSize:12, color:'#888' }}>Recarga · Ref: {r.ref_number}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#f59e0b' }}>{fmt(r.amount)}</span>
            </div>
          ))}
          {requests.withdrawals.filter(w=>w.status==='pending').map(w=>(
            <div key={w.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
              <span style={{ fontSize:12, color:'#888' }}>Retiro · {w.bank_name}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>{fmt(w.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Menu */}
      <div style={{ padding:'14px 0' }}>
        {menuItems.map((item,i)=>(
          <button key={i} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'13px 16px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,.05)', cursor:'pointer', textAlign:'left', color:'#fff' }}>
            <span style={{ fontSize:19, width:26, textAlign:'center' }}>{item.icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:14, margin:0 }}>{item.label}</p>
              <p style={{ fontSize:11, color:'#4a7fc1', margin:'1px 0 0' }}>{item.sub}</p>
            </div>
            <span style={{ color:'#2a4a7a', fontSize:16 }}>›</span>
          </button>
        ))}
      </div>

      {/* Mi Cuenta */}
      <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:16, overflow:'hidden', margin:'0 16px 12px' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>👤</span><span style={{ fontWeight:800, fontSize:15 }}>Mi Cuenta</span></div>
          <span style={{ color:'#2a4a7a' }}>›</span>
        </div>
        {accountItems.map((item,i)=>(
          <button key={i} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px 12px 48px', background:'transparent', border:'none', borderBottom:i<accountItems.length-1?'1px solid rgba(255,255,255,.04)':'none', cursor:'pointer', textAlign:'left', color:'#fff' }}>
            <span style={{ fontSize:15 }}>{item.icon}</span>
            <div style={{ flex:1 }}><p style={{ fontWeight:600, fontSize:14, margin:0, color:'#c0c0e0' }}>{item.label}</p><p style={{ fontSize:11, color:'#4a7fc1', margin:'1px 0 0' }}>{item.sub}</p></div>
            <span style={{ color:'#2a4a7a', fontSize:13 }}>›</span>
          </button>
        ))}
      </div>

      {/* Other */}
      {[{icon:'🧹',label:'Limpiar Caché',sub:'Liberar memoria'},{icon:'📲',label:'Descargar App',sub:'Versión móvil'},{icon:'📡',label:'Canal de pronósticos',sub:'Señales y análisis'}].map((item,i)=>(
        <button key={i} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'13px 16px', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, cursor:'pointer', textAlign:'left', color:'#fff', marginBottom:10, marginLeft:0 }}>
          <span style={{ fontSize:19, width:26, textAlign:'center' }}>{item.icon}</span>
          <div style={{ flex:1 }}><p style={{ fontWeight:700, fontSize:14, margin:0 }}>{item.label}</p><p style={{ fontSize:11, color:'#4a7fc1', margin:'1px 0 0' }}>{item.sub}</p></div>
          <span style={{ color:'#2a4a7a' }}>›</span>
        </button>
      ))}
      <div style={{ padding:'0 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <button style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:13, display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#c0c0e0' }}>🇩🇴<span style={{ fontSize:13, fontWeight:700 }}>Español</span><span style={{ marginLeft:'auto', color:'#2a4a7a' }}>›</span></button>
          <button style={{ background:'rgba(0,114,255,.08)', border:'1px solid rgba(0,114,255,.2)', borderRadius:14, padding:13, display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#4a9eff' }}>💬<span style={{ fontSize:13, fontWeight:700 }}>Soporte</span></button>
        </div>
        <button onClick={onLogout} style={{ ...S.btn('rgba(239,68,68,.08)'), color:'#f87171', border:'1px solid rgba(239,68,68,.2)', marginBottom:8 }}>Cerrar Sesión</button>
      </div>

      {rechargeModal&&<RechargeModal onClose={()=>setRechargeModal(false)} onDone={()=>{onRefresh();apiFetch('/api/recharge').then(r=>setRequests(prev=>({...prev,recharges:r}))).catch(()=>{})}} showToast={showToast}/>}
      {withdrawModal&&<WithdrawModal user={user} onClose={()=>setWithdrawModal(false)} onDone={()=>{onRefresh();apiFetch('/api/withdraw').then(w=>setRequests(prev=>({...prev,withdrawals:w}))).catch(()=>{})}} showToast={showToast}/>}
    </div>
  )
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ onLogout, showToast }) {
  const [stats,setStats]=useState(null); const [users,setUsers]=useState([]); const [tab,setTab]=useState('dashboard')
  const [newUser,setNewUser]=useState({name:'',email:'',password:''}); const [creating,setCreating]=useState(false)
  const [pendingR,setPendingR]=useState([]); const [pendingW,setPendingW]=useState([]); const [processing,setProcessing]=useState(null)

  const load = useCallback(async()=>{
    const [s,u,r,w]=await Promise.all([apiFetch('/api/stats'),apiFetch('/api/users'),apiFetch('/api/recharge'),apiFetch('/api/withdraw')])
    setStats(s);setUsers(u)
    setPendingR(r.filter(x=>x.status==='pending'))
    setPendingW(w.filter(x=>x.status==='pending'))
  },[])
  useEffect(()=>{ load() },[])

  const createUser=async()=>{
    if(!newUser.name||!newUser.email||!newUser.password){showToast('Completa todos los campos','error');return}
    setCreating(true)
    try{await apiFetch('/api/users',{method:'POST',body:newUser});showToast('Usuario creado ✓');setNewUser({name:'',email:'',password:''});load()}
    catch(e){showToast(e.message,'error')}
    setCreating(false)
  }

  const processRecharge=async(id,action)=>{
    setProcessing(id)
    try{await apiFetch('/api/recharge',{method:'PATCH',body:{id,action}});showToast(action==='approved'?'Recarga aprobada ✓':'Recarga rechazada');load()}
    catch(e){showToast(e.message,'error')}
    setProcessing(null)
  }

  const processWithdraw=async(id,action)=>{
    setProcessing(id)
    try{await apiFetch('/api/withdraw',{method:'PATCH',body:{id,action}});showToast(action==='approved'?'Retiro aprobado ✓':'Retiro rechazado');load()}
    catch(e){showToast(e.message,'error')}
    setProcessing(null)
  }

  const adminTabs=[{id:'dashboard',label:'📊 Panel'},{id:'requests',label:`⏳ Solicitudes ${pendingR.length+pendingW.length>0?`(${pendingR.length+pendingW.length})`:''}`},{id:'users',label:'👥 Usuarios'},{id:'tx',label:'💰 Transacciones'}]

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e' }}>
      {/* Admin header */}
      <div style={{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#0072ff,#00c6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>⛓️</div>
          <div><span style={{ fontFamily:"'Bebas Neue'", fontSize:18, letterSpacing:2 }}>DOPCHAIN</span><span style={{ marginLeft:8, background:'rgba(245,158,11,.15)', color:'#f59e0b', borderRadius:6, padding:'1px 8px', fontSize:10, fontWeight:700 }}>ADMIN</span></div>
        </div>
        <button onClick={onLogout} style={{ background:'none', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'6px 12px', color:'#888', fontSize:12, cursor:'pointer' }}>Salir</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,.07)', overflowX:'auto' }}>
        {adminTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'12px 16px', background:'transparent', border:'none', borderBottom:tab===t.id?'2px solid #0072ff':'2px solid transparent', color:tab===t.id?'#00c6ff':'#555', fontWeight:tab===t.id?800:600, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:16 }}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(stats?<>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[{label:'Usuarios',val:stats.totalUsers,color:'#00c6ff'},{label:'Depositado',val:fmt(stats.totalDeposits),color:'#4ade80'},{label:'Retirado',val:fmt(stats.totalWithdrawals),color:'#f87171'},{label:'Capital',val:fmt(stats.totalBalance),color:'#fbbf24'}].map(s=>(
              <div key={s.label} style={{ ...S.darkCard }}>
                <p style={{ fontSize:11, color:'#4a7fc1', marginBottom:6, textTransform:'uppercase', letterSpacing:.8 }}>{s.label}</p>
                <p style={{ fontFamily:"'Bebas Neue'", fontSize:20, color:s.color, letterSpacing:1 }}>{s.val}</p>
              </div>
            ))}
          </div>
          <div style={{ ...S.darkCard, marginBottom:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#aaa', marginBottom:12 }}>Saldos por usuario</p>
            {users.filter(u=>u.role==='user').slice(0,5).map(u=>(
              <div key={u.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0072ff,#00c6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{u.name[0]}</div>
                  <div><p style={{ fontWeight:700, fontSize:13 }}>{u.name}</p><p style={{ fontSize:11, color:'#4a7fc1' }}>{u.email}</p></div>
                </div>
                <p style={{ fontFamily:"'Bebas Neue'", fontSize:16, color:'#00c6ff' }}>{fmt(u.balance)}</p>
              </div>
            ))}
          </div>
        </>:<Spinner/>)}

        {/* REQUESTS */}
        {tab==='requests'&&(
          <div>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Solicitudes de Recarga</h3>
            {pendingR.length===0?<p style={{ color:'#4a7fc1', fontSize:13, marginBottom:20 }}>Sin solicitudes pendientes ✓</p>
            :pendingR.map(r=>(
              <div key={r.id} style={{ ...S.darkCard, marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div><p style={{ fontWeight:800, fontSize:15 }}>{r.users?.name}</p><p style={{ fontSize:12, color:'#4a7fc1' }}>{r.users?.email}</p></div>
                  <p style={{ fontFamily:"'Bebas Neue'", fontSize:20, color:'#4ade80', letterSpacing:1 }}>{fmt(r.amount)}</p>
                </div>
                <p style={{ fontSize:12, color:'#888', marginBottom:10 }}>Banco: <strong style={{ color:'#ccc' }}>{r.bank_name}</strong> · Ref: <strong style={{ color:'#ccc' }}>{r.ref_number}</strong></p>
                <p style={{ fontSize:11, color:'#4a7fc1', marginBottom:12 }}>{r.created_at?.slice(0,16).replace('T',' ')}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={()=>processRecharge(r.id,'rejected')} disabled={processing===r.id} style={{ ...S.btn('rgba(239,68,68,.15)'), color:'#f87171', border:'1px solid rgba(239,68,68,.3)', fontSize:13 }}>{processing===r.id?'…':'✗ Rechazar'}</button>
                  <button onClick={()=>processRecharge(r.id,'approved')} disabled={processing===r.id} style={{ ...S.btn('linear-gradient(135deg,#059669,#10b981)'), fontSize:13 }}>{processing===r.id?'…':'✓ Aprobar'}</button>
                </div>
              </div>
            ))}

            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16, marginTop:8 }}>Solicitudes de Retiro</h3>
            {pendingW.length===0?<p style={{ color:'#4a7fc1', fontSize:13 }}>Sin solicitudes pendientes ✓</p>
            :pendingW.map(w=>(
              <div key={w.id} style={{ ...S.darkCard, marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div><p style={{ fontWeight:800, fontSize:15 }}>{w.users?.name}</p><p style={{ fontSize:12, color:'#4a7fc1' }}>{w.users?.email}</p></div>
                  <p style={{ fontFamily:"'Bebas Neue'", fontSize:20, color:'#f87171', letterSpacing:1 }}>{fmt(w.amount)}</p>
                </div>
                <p style={{ fontSize:12, color:'#888', marginBottom:4 }}>Banco: <strong style={{ color:'#ccc' }}>{w.bank_name}</strong></p>
                <p style={{ fontSize:12, color:'#888', marginBottom:4 }}>Cuenta: <strong style={{ color:'#ccc' }}>{w.account_number}</strong></p>
                <p style={{ fontSize:12, color:'#888', marginBottom:10 }}>Titular: <strong style={{ color:'#ccc' }}>{w.account_name}</strong></p>
                <p style={{ fontSize:11, color:'#4a7fc1', marginBottom:12 }}>{w.created_at?.slice(0,16).replace('T',' ')}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <button onClick={()=>processWithdraw(w.id,'rejected')} disabled={processing===w.id} style={{ ...S.btn('rgba(239,68,68,.15)'), color:'#f87171', border:'1px solid rgba(239,68,68,.3)', fontSize:13 }}>✗ Rechazar</button>
                  <button onClick={()=>processWithdraw(w.id,'approved')} disabled={processing===w.id} style={{ ...S.btn('linear-gradient(135deg,#059669,#10b981)'), fontSize:13 }}>✓ Aprobar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {tab==='users'&&(
          <div>
            <div style={{ ...S.darkCard, marginBottom:16 }}>
              <p style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>➕ Crear usuario</p>
              <label style={S.label}>Nombre</label>
              <input value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} placeholder="Nombre completo" style={S.input}/>
              <label style={S.label}>Correo</label>
              <input value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} type="email" placeholder="correo@ejemplo.do" style={S.input}/>
              <label style={S.label}>Contraseña</label>
              <input value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} type="password" placeholder="Mínimo 8 caracteres" style={S.input}/>
              <button onClick={createUser} disabled={creating} style={S.btn('linear-gradient(135deg,#0072ff,#00c6ff)')}>{creating?'Creando…':'Crear usuario ✓'}</button>
            </div>
            {users.filter(u=>u.role==='user').map(u=>(
              <div key={u.id} style={{ ...S.darkCard, marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0072ff,#00c6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{u.name[0]}</div>
                    <div><p style={{ fontWeight:700, fontSize:14 }}>{u.name}</p><p style={{ fontSize:11, color:'#4a7fc1' }}>{u.email}</p></div>
                  </div>
                  <p style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:'#00c6ff', letterSpacing:1 }}>{fmt(u.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab==='tx'&&<TransactionsAdmin showToast={showToast}/>}
      </div>
    </div>
  )
}

function TransactionsAdmin({ showToast }) {
  const [txs,setTxs]=useState(null); const [modal,setModal]=useState(null); const [form,setForm]=useState({}); const [users,setUsers]=useState([]); const [loading,setLoading]=useState(false)
  useEffect(()=>{ Promise.all([apiFetch('/api/transactions'),apiFetch('/api/users')]).then(([t,u])=>{setTxs(t);setUsers(u)}).catch(()=>{}) },[])
  const submit=async()=>{
    setLoading(true)
    try{ await apiFetch('/api/transactions',{method:'POST',body:{...form,amount:parseFloat(form.amount)}}); showToast('Transacción registrada ✓'); setModal(null); setForm({}); apiFetch('/api/transactions').then(setTxs) }
    catch(e){showToast(e.message,'error')}
    setLoading(false)
  }
  const typeColor={deposit:'#4ade80',withdrawal:'#f87171',bet_win:'#fbbf24',bet_loss:'#f87171'}
  const typeLabel={deposit:'Depósito',withdrawal:'Retiro',bet_win:'Apuesta ✓',bet_loss:'Apuesta ✗'}
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ fontSize:16, fontWeight:800 }}>Transacciones</h3>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>{setModal('deposit');setForm({type:'deposit'})}} style={{ background:'rgba(74,222,128,.15)', border:'1px solid rgba(74,222,128,.3)', borderRadius:8, padding:'7px 12px', color:'#4ade80', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Depósito</button>
          <button onClick={()=>{setModal('withdrawal');setForm({type:'withdrawal'})}} style={{ background:'rgba(248,113,113,.15)', border:'1px solid rgba(248,113,113,.3)', borderRadius:8, padding:'7px 12px', color:'#f87171', fontSize:12, fontWeight:700, cursor:'pointer' }}>- Retiro</button>
        </div>
      </div>
      {!txs?<Spinner/>:txs.slice(0,30).map(t=>(
        <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'center' }}>
          <div>
            <span style={{ background:`${typeColor[t.type]}18`, color:typeColor[t.type], borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{typeLabel[t.type]}</span>
            <p style={{ fontSize:12, color:'#4a7fc1', marginTop:3 }}>{t.users?.name||'—'} · {t.date}</p>
          </div>
          <p style={{ fontFamily:"'Bebas Neue'", fontSize:16, color:t.type==='deposit'||t.type==='bet_win'?'#4ade80':'#f87171', letterSpacing:.5 }}>{fmt(t.amount)}</p>
        </div>
      ))}
      {modal&&(
        <Modal title={modal==='deposit'?'Registrar Depósito':'Registrar Retiro'} onClose={()=>{setModal(null);setForm({})}}>
          <label style={S.label}>Usuario</label>
          <select value={form.user_id||''} onChange={e=>setForm({...form,user_id:e.target.value})} style={{...S.input,appearance:'none'}}>
            <option value="">Seleccionar…</option>
            {users.filter(u=>u.role==='user').map(u=><option key={u.id} value={u.id}>{u.name} — {fmt(u.balance)}</option>)}
          </select>
          <label style={S.label}>Monto (DOP)</label>
          <input value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})} type="number" placeholder="0.00" style={S.input}/>
          <label style={S.label}>Método</label>
          <select value={form.method||'Transferencia bancaria'} onChange={e=>setForm({...form,method:e.target.value})} style={{...S.input,appearance:'none'}}>
            {['Transferencia bancaria','Depósito bancario','Efectivo','Pago móvil','Otro'].map(m=><option key={m}>{m}</option>)}
          </select>
          <label style={S.label}>Nota</label>
          <input value={form.note||''} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Opcional…" style={S.input}/>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setModal(null);setForm({})}} style={{...S.ghostBtn,flex:1}}>Cancelar</button>
            <button onClick={submit} disabled={loading} style={{...S.btn(modal==='deposit'?'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#b91c1c,#ef4444)'),flex:2,opacity:loading?.5:1}}>{loading?'Procesando…':modal==='deposit'?'Confirmar Depósito':'Confirmar Retiro'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const items=[{id:'home',icon:'🏠',label:'Inicio'},{id:'team',icon:'👥',label:'Equipo'},{id:'bets',icon:'🎲',label:'Apuestas'},{id:'profile',icon:'👤',label:'Perfil'}]
  return (
    <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:500, background:'rgba(10,15,30,.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', zIndex:100 }}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>setTab(item.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 4px 14px', background:'transparent', border:'none', cursor:'pointer', gap:3, position:'relative' }}>
          {tab===item.id&&<div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:32, height:2, background:'linear-gradient(90deg,#0072ff,#00c6ff)', borderRadius:'0 0 2px 2px' }}/>}
          <span style={{ fontSize:20, filter:tab===item.id?'none':'grayscale(1) opacity(.4)' }}>{item.icon}</span>
          <span style={{ fontSize:10, fontWeight:tab===item.id?800:600, color:tab===item.id?'#00c6ff':'#2a4a7a', letterSpacing:.3 }}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [user,setUser]=useState(null); const [loading,setLoading]=useState(true); const [tab,setTab]=useState('home')
  const [toast,setToast]=useState(null)
  const showToast=(msg,type='success')=>setToast({msg,type})

  useEffect(()=>{
    const t=localStorage.getItem('dopchain_token')
    if(!t){setLoading(false);return}
    apiFetch('/api/me').then(u=>{setUser(u);setLoading(false)}).catch(()=>{localStorage.removeItem('dopchain_token');setLoading(false)})
  },[])

  const refresh=useCallback(async()=>{
    try{const u=await apiFetch('/api/me');setUser(u)}catch{}
  },[])

  const logout=()=>{ localStorage.removeItem('dopchain_token'); setUser(null) }

  if(loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0f1e' }}><Spinner/></div>
  if(!user) return <Login onLogin={u=>setUser(u)}/>
  if(user.role==='admin') return <><AdminPanel onLogout={logout} showToast={showToast}/>{toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}</>

  return (
    <>
      <Head><title>DOPCHAIN</title><meta name="viewport" content="width=device-width,initial-scale=1"/></Head>
      <div style={{ background:'#0a0f1e', minHeight:'100vh', maxWidth:500, margin:'0 auto', position:'relative' }}>
        <Header user={user}/>
        {tab==='home'&&<HomeTab user={user} onRefresh={refresh} showToast={showToast}/>}
        {tab==='team'&&<TeamTab user={user} showToast={showToast}/>}
        {tab==='bets'&&<BetsTab/>}
        {tab==='profile'&&<ProfileTab user={user} onLogout={logout} showToast={showToast} onRefresh={refresh}/>}
        <BottomNav tab={tab} setTab={setTab}/>

        {/* Hidden triggers for home tab buttons */}
        <button id="recharge-trigger" style={{ display:'none' }} onClick={()=>setTab('profile')}/>
        <button id="withdraw-trigger" style={{ display:'none' }} onClick={()=>setTab('profile')}/>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </>
  )
}
