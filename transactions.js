import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/auth'
import { today } from '../../lib/utils'

export default requireAuth(async (req, res) => {
  const isAdmin = req.user.role === 'admin'

  if (req.method === 'GET') {
    let q = supabaseAdmin.from('transactions')
      .select('*,users(name,email)')
      .order('created_at', { ascending: false })
    if (!isAdmin) q = q.eq('user_id', req.user.id)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { type, amount, method, note, user_id } = req.body
    if (!['deposit','withdrawal'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' })
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' })
    const uid = isAdmin && user_id ? user_id : req.user.id
    const { data: u } = await supabaseAdmin.from('users').select('balance').eq('id', uid).single()
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (type === 'withdrawal' && amount > u.balance) return res.status(400).json({ error: 'Saldo insuficiente' })
    const newBal = type === 'deposit' ? u.balance + parseFloat(amount) : u.balance - parseFloat(amount)
    const [{ data: tx, error: e1 }, { error: e2 }] = await Promise.all([
      supabaseAdmin.from('transactions').insert({ user_id: uid, type, amount: parseFloat(amount), method: method || 'Transferencia bancaria', note: note || '', date: today(), created_by: req.user.id }).select().single(),
      supabaseAdmin.from('users').update({ balance: newBal }).eq('id', uid)
    ])
    if (e1 || e2) return res.status(500).json({ error: e1?.message || e2?.message })
    return res.status(201).json({ transaction: tx, new_balance: newBal })
  }

  return res.status(405).end()
})
