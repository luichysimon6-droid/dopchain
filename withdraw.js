import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../lib/auth'
import { today } from '../../lib/utils'

export default requireAuth(async (req, res) => {
  const isAdmin = req.user.role === 'admin'

  if (req.method === 'GET') {
    let q = supabaseAdmin.from('withdrawal_requests')
      .select('*,users(name,email)')
      .order('created_at', { ascending: false })
    if (!isAdmin) q = q.eq('user_id', req.user.id)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { amount, bank_name, account_number, account_name } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' })
    if (!bank_name || !account_number || !account_name) return res.status(400).json({ error: 'Faltan datos bancarios' })
    const { data: u } = await supabaseAdmin.from('users').select('balance').eq('id', req.user.id).single()
    if (!u || parseFloat(amount) > u.balance) return res.status(400).json({ error: 'Saldo insuficiente' })
    // Reserve the amount
    await supabaseAdmin.from('users').update({ balance: u.balance - parseFloat(amount) }).eq('id', req.user.id)
    const { data, error } = await supabaseAdmin.from('withdrawal_requests')
      .insert({ user_id: req.user.id, amount: parseFloat(amount), bank_name, account_number, account_name, status: 'pending' })
      .select().single()
    if (error) {
      // Rollback balance
      await supabaseAdmin.from('users').update({ balance: u.balance }).eq('id', req.user.id)
      return res.status(500).json({ error: error.message })
    }
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    if (!isAdmin) return res.status(403).json({ error: 'Solo administradores' })
    const { id, action, admin_note } = req.body
    if (!['approved','rejected'].includes(action)) return res.status(400).json({ error: 'Acción inválida' })
    const { data: wr } = await supabaseAdmin.from('withdrawal_requests').select('*').eq('id', id).single()
    if (!wr || wr.status !== 'pending') return res.status(400).json({ error: 'No encontrada o ya procesada' })

    await supabaseAdmin.from('withdrawal_requests').update({ status: action, admin_note: admin_note || '', reviewed_at: new Date().toISOString() }).eq('id', id)

    if (action === 'approved') {
      await supabaseAdmin.from('transactions').insert({ user_id: wr.user_id, type: 'withdrawal', amount: wr.amount, method: 'Transferencia bancaria', note: `Retiro aprobado - ${wr.bank_name} ${wr.account_number}`, date: today(), created_by: req.user.id, status: 'completed' })
    } else {
      // Refund balance on rejection
      const { data: u } = await supabaseAdmin.from('users').select('balance').eq('id', wr.user_id).single()
      await supabaseAdmin.from('users').update({ balance: u.balance + wr.amount }).eq('id', wr.user_id)
    }
    return res.status(200).json({ success: true, action })
  }

  return res.status(405).end()
})
