import { NextResponse } from 'next/server'
import { getDb, runQuery } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const totalReqs = runQuery(db, `SELECT COUNT(*) as count FROM requests r JOIN api_keys k ON r.api_key_id = k.id WHERE k.user_id = ?`, [session.userId])
  const totalTokens = runQuery(db, `SELECT COALESCE(SUM(total_tokens), 0) as tokens FROM requests r JOIN api_keys k ON r.api_key_id = k.id WHERE k.user_id = ?`, [session.userId])
  const cost24h = runQuery(db, `SELECT COALESCE(SUM(cost), 0) as cost FROM requests r JOIN api_keys k ON r.api_key_id = k.id WHERE k.user_id = ? AND r.created_at > datetime('now', '-24 hours')`, [session.userId])
  const reqs24h = runQuery(db, `SELECT COUNT(*) as count FROM requests r JOIN api_keys k ON r.api_key_id = k.id WHERE k.user_id = ? AND r.created_at > datetime('now', '-24 hours')`, [session.userId])
  const topModels = runQuery(db, `SELECT model, COUNT(*) as count FROM requests r JOIN api_keys k ON r.api_key_id = k.id WHERE k.user_id = ? AND r.created_at > datetime('now', '-24 hours') GROUP BY model ORDER BY count DESC LIMIT 5`, [session.userId])
  const activeKeys = runQuery(db, `SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = 1`, [session.userId])
  const keyStats = runQuery(db, `
    SELECT k.name, k.key,
      (SELECT COUNT(*) FROM requests WHERE api_key_id = k.id AND created_at > datetime('now', '-24 hours')) as requests_24h,
      (SELECT COALESCE(SUM(cost), 0) FROM requests WHERE api_key_id = k.id) as total_cost,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM requests WHERE api_key_id = k.id) as total_tokens
    FROM api_keys k WHERE k.user_id = ? AND k.is_active = 1
  `, [session.userId])

  return NextResponse.json({
    totalRequests: totalReqs[0]?.count || 0,
    totalTokens: totalTokens[0]?.tokens || 0,
    cost24h: cost24h[0]?.cost || 0,
    requests24h: reqs24h[0]?.count || 0,
    topModels,
    activeKeys: activeKeys[0]?.count || 0,
    keyStats,
  })
}
