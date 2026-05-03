import jwt from 'jsonwebtoken'
const SECRET = process.env.JWT_SECRET || 'dopchain_secret'
export const signToken = (p) => jwt.sign(p, SECRET, { expiresIn: '30d' })
export const verifyToken = (t) => { try { return jwt.verify(t, SECRET) } catch { return null } }
export function getToken(req) { const a = req.headers.authorization || ''; return a.startsWith('Bearer ') ? a.slice(7) : null }
export function requireAuth(fn) { return async (req, res) => { const t = getToken(req); if (!t) return res.status(401).json({ error: 'No autorizado' }); const u = verifyToken(t); if (!u) return res.status(401).json({ error: 'Sesión expirada' }); req.user = u; return fn(req, res) } }
export function requireAdmin(fn) { return requireAuth(async (req, res) => { if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' }); return fn(req, res) }) }
