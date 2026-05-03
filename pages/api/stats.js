import { supabaseAdmin } from '../../lib/supabase'
import { requireAdmin } from '../../lib/auth'
export default requireAdmin(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end()
  const today = new Date().toISOString().slice(0,10)
  const [{ data: users },{ data: txs },{ data: pendingRecharge },{ data: pendingWithdraw },{ data: todayBets }] = await Promise.all([
    supabaseAdmin.from('users').select('id,name,balance,role,vip,created_at').eq('role','user'),
    supabaseAdmin.from('transactions').select('type,amount,date'),
    supabaseAdmin.from('recharge_requests').select('id,amount,users(name),created_at').eq('status','pending').order('created_at',{ascending:false}),
    supabaseAdmin.from('withdrawal_requests').select('id,amount,users(name),created_at').eq('status','pending').order('created_at',{ascending:false}),
    supabaseAdmin.from('bets').select('id').gte('created_at',today+'T00:00:00'),
  ])
  const totalDeposits = txs?.filter(t=>t.type==='deposit').reduce((a,t)=>a+t.amount,0)||0
  const totalWithdrawals = txs?.filter(t=>t.type==='withdrawal').reduce((a,t)=>a+t.amount,0)||0
  const totalBalance = users?.reduce((a,u)=>a+u.balance,0)||0
  const monthly = []
  for (let i=5;i>=0;i--) { const d=new Date(); d.setMonth(d.getMonth()-i); const y=d.getFullYear(),m=d.getMonth(),label=d.toLocaleString('es-DO',{month:'short'}); monthly.push({ label, deposits: txs?.filter(t=>{const td=new Date(t.date);return t.type==='deposit'&&td.getFullYear()===y&&td.getMonth()===m}).reduce((a,t)=>a+t.amount,0)||0, withdrawals: txs?.filter(t=>{const td=new Date(t.date);return t.type==='withdrawal'&&td.getFullYear()===y&&td.getMonth()===m}).reduce((a,t)=>a+t.amount,0)||0 }) }
  return res.status(200).json({ totalUsers: users?.length||0, totalDeposits, totalWithdrawals, totalBalance, todayBets: todayBets?.length||0, monthly, topUsers: [...(users||[])].sort((a,b)=>b.balance-a.balance).slice(0,5), pendingRecharge: pendingRecharge||[], pendingWithdraw: pendingWithdraw||[] })
})
