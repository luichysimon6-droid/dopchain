import { supabaseAdmin } from '../../lib/supabase'
import { signToken } from '../../lib/auth'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos' })

  const { data: user } = await supabaseAdmin
    .from('users').select('*').eq('email', email.toLowerCase()).single()

  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' })
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role })
  const { password_hash, ...safe } = user
  return res.status(200).json({ token, user: safe })
}
