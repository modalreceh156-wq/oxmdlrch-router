import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { action, username, password } = await req.json()

  if (action === 'register') {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 400 })

    const hashed = await hashPassword(password)
    const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed)
    const token = signToken({ userId: result.lastInsertRowid as number, username })

    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 86400 })

    return NextResponse.json({ success: true, username })
  }

  if (action === 'login') {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await verifyPassword(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = signToken({ userId: user.id, username: user.username })
    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 86400 })

    return NextResponse.json({ success: true, username: user.username })
  }

  if (action === 'logout') {
    const cookieStore = await cookies()
    cookieStore.delete('token')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
