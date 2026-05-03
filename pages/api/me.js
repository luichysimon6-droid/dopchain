import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/auth'
export default requireAuth(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end()
  const { data, error } = await supabaseAdmin.from('users').select('id,name,email,role,balance,vip,avatar_url,ref_code,created_at').eq('id', req.user.id).single()
  if (error) return res.status(404).json({ error: 'Usuario no encontrado' })
  return res.status(200).json(data)
})
