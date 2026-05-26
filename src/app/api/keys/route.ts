import { NextRequest, NextResponse } from 'next/server'
import { getDb, runQuery, runExec, getLastInsertId } from '@/lib/db'
import { getSession, generateApiKey } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const keys = runQuery(db, `
    SELECT k.*,
      (SELECT COUNT(*) FROM requests WHERE api_key_id = k.id AND created_at > datetime('now', '-24 hours')) as requests_24h,
      (SELECT COALESCE(SUM(cost), 0) FROM requests WHERE api_key_id = k.id) as total_cost
    FROM api_keys k WHERE k.user_id = ?
  `, [session.userId])

  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, provider, providerKey, model } = await req.json()
  if (!name || !provider || !providerKey) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = await getDb()
  const key = generateApiKey()
  runExec(db, `INSERT INTO api_keys (user_id, name, key, provider, provider_key, model) VALUES (?, ?, ?, ?, ?, ?)`,
    [session.userId, name, key, provider, providerKey, model || null])

  return NextResponse.json({ key, name })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const db = await getDb()
  runExec(db, 'DELETE FROM api_keys WHERE id = ? AND user_id = ?', [id, session.userId])

  return NextResponse.json({ success: true })
}
