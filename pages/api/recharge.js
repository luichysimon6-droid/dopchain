import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/auth'
export default requireAuth(async (req, res) => {
  const isAdmin = req.user.role === 'admin'
  if (req.method === 'GET') {
    let q = supabaseAdmin.from('recharge_requests').select('*,users(name,email)').order('created_at', { ascending: false })
    if (!isAdmin) q = q.eq('user_id', req.user.id)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'POST') {
    const { amount, bank_name, ref_number } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' })
    if (!bank_name || !ref_number) return res.status(400).json({ error: 'Faltan datos bancarios' })
    const { data, error } = await supabaseAdmin.from('recharge_requests').insert({ user_id: req.user.id, amount: parseFloat(amount), bank_name, ref_number, status: 'pending' }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }
  if (req.method === 'PATCH') {
    if (!isAdmin) return res.status(403).json({ error: 'Solo administradores' })
    const { id, action, admin_note } = req.body
    if (!['approved','rejected'].includes(action)) return res.status(400).json({ error: 'Acción inválida' })
    const { data: r } = await supabaseAdmin.from('recharge_requests').select('*').eq('id', id).single()
    if (!r || r.status !== 'pending') return res.status(400).json({ error: 'No encontrada o ya procesada' })
    await supabaseAdmin.from('recharge_requests').update({ status: action, admin_note: admin_note||'', reviewed_at: new Date().toISOString() }).eq('id', id)
    if (action === 'approved') {
      const { data: u } = await supabaseAdmin.from('users').select('balance').eq('id', r.user_id).single()
      const today = new Date().toISOString().slice(0,10)
      await Promise.all([
        supabaseAdmin.from('users').update({ balance: u.balance + r.amount }).eq('id', r.user_id),
        supabaseAdmin.from('transactions').insert({ user_id: r.user_id, type: 'deposit', amount: r.amount, method: 'Transferencia bancaria', note: `Recarga aprobada - Ref: ${r.ref_number}`, date: today, created_by: req.user.id, status: 'completed' })
      ])
    }
    return res.status(200).json({ success: true, action })
  }
  return res.status(405).end()
})
