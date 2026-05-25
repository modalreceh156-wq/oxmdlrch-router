'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isRegister ? 'register' : 'login', username, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            oxmdlrch
          </h1>
          <p className="text-sm text-gray-400 mt-2">AI Model Router</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#1e293b] rounded-lg focus:outline-none focus:border-brand-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#1e293b] rounded-lg focus:outline-none focus:border-brand-500 transition"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? '...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          <button onClick={() => setIsRegister(!isRegister)} className="text-brand-400 hover:underline">
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </p>
      </div>
    </div>
  )
}
