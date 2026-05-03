import { supabaseAdmin } from '../../lib/supabase'
import { requireAdmin } from '../../lib/auth'
import bcrypt from 'bcryptjs'

export default requireAdmin(async (req, res) => {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id,name,email,role,balance,vip,ref_code,created_at')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name, email, password, role = 'user' } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Faltan campos' })
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email.toLowerCase()).single()
    if (existing) return res.status(409).json({ error: 'El correo ya existe' })
    const hash = await bcrypt.hash(password, 10)
    const refCode = 'DOPC-' + name.toUpperCase().replace(/\s/g,'').slice(0,4) + Math.random().toString(36).slice(2,6).toUpperCase()
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ name, email: email.toLowerCase(), password_hash: hash, role, balance: 0, ref_code: refCode })
      .select('id,name,email,role,balance,ref_code').single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).end()
})
