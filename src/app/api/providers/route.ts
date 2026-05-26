import { NextResponse, NextRequest } from 'next/server'
import { getDb, runQuery, runExec } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const providers = runQuery(db, 'SELECT id, name, base_url, is_active, priority FROM providers ORDER BY priority DESC', [])
  return NextResponse.json({ providers })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, baseUrl, apiKey, priority } = await req.json()
  if (!name || !baseUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = await getDb()
  runExec(db, `INSERT OR REPLACE INTO providers (name, base_url, api_key, priority) VALUES (?, ?, ?, ?)`,
    [name, baseUrl, apiKey || null, priority || 0])

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const db = await getDb()
  runExec(db, 'DELETE FROM providers WHERE id = ?', [id])
  return NextResponse.json({ success: true })
}
