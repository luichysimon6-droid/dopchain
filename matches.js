import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth, requireAdmin } from '../../lib/auth'

export default requireAuth(async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('matches')
      .select('*').order('match_date').order('match_time')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).end()
    const { home_team, away_team, home_logo, away_logo, match_time, match_date } = req.body
    if (!home_team || !away_team || !match_time || !match_date) return res.status(400).json({ error: 'Faltan datos' })
    const { data, error } = await supabaseAdmin.from('matches')
      .insert({ home_team, away_team, home_logo: home_logo||'⚽', away_logo: away_logo||'⚽', match_time, match_date })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).end()
})
