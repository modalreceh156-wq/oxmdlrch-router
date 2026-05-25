import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Total requests
  const totalReqs = db.prepare(`
    SELECT COUNT(*) as count FROM requests r
    JOIN api_keys k ON r.api_key_id = k.id
    WHERE k.user_id = ?
  `).get(session.userId) as any

  // Total tokens
  const totalTokens = db.prepare(`
    SELECT COALESCE(SUM(total_tokens), 0) as tokens FROM requests r
    JOIN api_keys k ON r.api_key_id = k.id
    WHERE k.user_id = ?
  `).get(session.userId) as any

  // Cost 24h
  const cost24h = db.prepare(`
    SELECT COALESCE(SUM(cost), 0) as cost FROM requests r
    JOIN api_keys k ON r.api_key_id = k.id
    WHERE k.user_id = ? AND r.created_at > datetime('now', '-24 hours')
  `).get(session.userId) as any

  // Requests 24h
  const reqs24h = db.prepare(`
    SELECT COUNT(*) as count FROM requests r
    JOIN api_keys k ON r.api_key_id = k.id
    WHERE k.user_id = ? AND r.created_at > datetime('now', '-24 hours')
  `).get(session.userId) as any

  // Top models 24h
  const topModels = db.prepare(`
    SELECT model, COUNT(*) as count FROM requests r
    JOIN api_keys k ON r.api_key_id = k.id
    WHERE k.user_id = ? AND r.created_at > datetime('now', '-24 hours')
    GROUP BY model ORDER BY count DESC LIMIT 5
  `).all(session.userId)

  // Active keys
  const activeKeys = db.prepare(`
    SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = 1
  `).get(session.userId) as any

  // Per-key stats
  const keyStats = db.prepare(`
    SELECT k.name, k.key,
      (SELECT COUNT(*) FROM requests WHERE api_key_id = k.id AND created_at > datetime('now', '-24 hours')) as requests_24h,
      (SELECT COALESCE(SUM(cost), 0) FROM requests WHERE api_key_id = k.id) as total_cost,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM requests WHERE api_key_id = k.id) as total_tokens
    FROM api_keys k WHERE k.user_id = ? AND k.is_active = 1
  `).all(session.userId)

  return NextResponse.json({
    totalRequests: totalReqs.count,
    totalTokens: totalTokens.tokens,
    cost24h: cost24h.cost,
    requests24h: reqs24h.count,
    topModels,
    activeKeys: activeKeys.count,
    keyStats,
  })
}
