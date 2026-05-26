import { NextRequest, NextResponse } from 'next/server'
import { getDb, runQuery, runExec } from '@/lib/db'
import { hashPassword, verifyPassword, signToken } from '@/lib/auth'
import { getLastInsertId } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { action, username, password } = await req.json()
  const db = await getDb()

  if (action === 'register') {
    const existing = runQuery(db, 'SELECT id FROM users WHERE username = ?', [username])
    if (existing.length > 0) return NextResponse.json({ error: 'Username taken' }, { status: 400 })

    const hashed = await hashPassword(password)
    runExec(db, 'INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed])
    const userId = getLastInsertId(db)
    const token = signToken({ userId, username })

    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 86400 })

    return NextResponse.json({ success: true, username })
  }

  if (action === 'login') {
    const users = runQuery(db, 'SELECT * FROM users WHERE username = ?', [username])
    if (users.length === 0) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const user = users[0]

    const valid = await verifyPassword(password, user.password as string)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = signToken({ userId: user.id as number, username: user.username as string })
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
