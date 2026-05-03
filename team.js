import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/auth'
import { today } from '../../lib/utils'

export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end()

  // Get user's ref_code
  const { data: me } = await supabaseAdmin.from('users').select('ref_code').eq('id', req.user.id).single()

  // Direct referrals (level 1)
  const { data: lv1 } = await supabaseAdmin.from('users')
    .select('id,name,email,balance,created_at')
    .eq('referred_by', req.user.id)

  const lv1Ids = lv1?.map(u => u.id) || []

  // Level 2 referrals
  let lv2 = []
  if (lv1Ids.length > 0) {
    const { data } = await supabaseAdmin.from('users')
      .select('id,name,email,balance,created_at')
      .in('referred_by', lv1Ids)
    lv2 = data || []
  }

  const lv2Ids = lv2.map(u => u.id)
  let lv3 = []
  if (lv2Ids.length > 0) {
    const { data } = await supabaseAdmin.from('users')
      .select('id,name,email,balance,created_at')
      .in('referred_by', lv2Ids)
    lv3 = data || []
  }

  // Get today's new members
  const todayStr = today()
  const newToday = [...lv1||[], ...lv2, ...lv3].filter(u => u.created_at?.slice(0,10) === todayStr).length

  // Total recharges from team
  const allIds = [...lv1Ids, ...lv2Ids, ...lv3.map(u=>u.id)]
  let totalRecharges = 0, totalWithdrawals = 0, totalBets = 0
  if (allIds.length > 0) {
    const { data: txs } = await supabaseAdmin.from('transactions')
      .select('type,amount').in('user_id', allIds)
    totalRecharges = txs?.filter(t=>t.type==='deposit').reduce((a,t)=>a+t.amount,0)||0
    totalWithdrawals = txs?.filter(t=>t.type==='withdrawal').reduce((a,t)=>a+t.amount,0)||0
    totalBets = txs?.filter(t=>t.type==='bet_win'||t.type==='bet_loss').reduce((a,t)=>a+t.amount,0)||0
  }

  // Commission (5% of level1 recharges, 3% lv2, 1% lv3)
  const commission = totalRecharges * 0.05
  const todayGain = commission * 0.1 // simplified

  return res.status(200).json({
    refCode: me?.ref_code || '',
    members: {
      lv1: (lv1||[]).map(u=>({...u, level:1, inv: u.balance})),
      lv2: lv2.map(u=>({...u, level:2, inv: u.balance})),
      lv3: lv3.map(u=>({...u, level:3, inv: u.balance})),
    },
    stats: {
      total: (lv1||[]).length + lv2.length + lv3.length,
      newToday,
      totalRecharges, totalWithdrawals, totalBets,
      totalIncome: commission,
      todayGain,
    }
  })
})
