import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/auth'
export default requireAuth(async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('bets').select('*,matches(home_team,away_team,match_date,status)').eq('user_id', req.user.id).order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'POST') {
    const { match_id, team, amount } = req.body
    if (!match_id || !team || !amount || amount <= 0) return res.status(400).json({ error: 'Datos inválidos' })
    const { data: match } = await supabaseAdmin.from('matches').select('*').eq('id', match_id).single()
    if (!match || match.status === 'finished') return res.status(400).json({ error: 'Partido no disponible' })
    const today = new Date().toISOString().slice(0,10)
    const { data: existing } = await supabaseAdmin.from('bets').select('id').eq('user_id', req.user.id).gte('created_at', today+'T00:00:00').limit(1)
    if (existing?.length > 0) return res.status(409).json({ error: 'Solo 1 apuesta por día' })
    const { data: u } = await supabaseAdmin.from('users').select('balance').eq('id', req.user.id).single()
    if (!u || parseFloat(amount) > u.balance) return res.status(400).json({ error: 'Saldo insuficiente' })
    const won = Math.random() < 0.45
    const gain = won ? parseFloat(amount) * 0.8 : 0
    const result = won ? 'win' : 'loss'
    const newBal = won ? u.balance + gain : u.balance - parseFloat(amount)
    const [{ data: bet, error: bErr }] = await Promise.all([
      supabaseAdmin.from('bets').insert({ user_id: req.user.id, match_id, team, amount: parseFloat(amount), result, gain }).select().single(),
      supabaseAdmin.from('users').update({ balance: newBal }).eq('id', req.user.id),
      supabaseAdmin.from('transactions').insert({ user_id: req.user.id, type: won?'bet_win':'bet_loss', amount: won?gain:parseFloat(amount), method: 'Apuesta', note: `${match.home_team} vs ${match.away_team}`, date: today, created_by: req.user.id, status: 'completed' })
    ])
    if (bErr) return res.status(500).json({ error: bErr.message })
    return res.status(201).json({ bet, won, gain, new_balance: newBal })
  }
  return res.status(405).end()
})
