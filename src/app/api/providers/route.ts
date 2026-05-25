import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const providers = db.prepare('SELECT id, name, base_url, is_active, priority FROM providers ORDER BY priority DESC').all()
  return NextResponse.json({ providers })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, baseUrl, apiKey, priority } = await req.json()
  if (!name || !baseUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  db.prepare(`
    INSERT OR REPLACE INTO providers (name, base_url, api_key, priority)
    VALUES (?, ?, ?, ?)
  `).run(name, baseUrl, apiKey || null, priority || 0)

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  db.prepare('DELETE FROM providers WHERE id = ?').run(id)
  return NextResponse.json({ success: true })
}
