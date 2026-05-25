'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  totalRequests: number
  totalTokens: number
  cost24h: number
  requests24h: number
  topModels: { model: string; count: number }[]
  activeKeys: number
  keyStats: { name: string; key: string; requests_24h: number; total_cost: number; total_tokens: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stats')
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data) setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if (!stats) return null

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            oxmdlrch Router
          </h1>
          <p className="text-sm text-gray-400">AI Model Gateway</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/dashboard/keys')} className="px-4 py-2 glass-card hover:border-brand-500 transition text-sm">
            API Keys
          </button>
          <button onClick={() => router.push('/dashboard/providers')} className="px-4 py-2 glass-card hover:border-brand-500 transition text-sm">
            Providers
          </button>
          <button onClick={async () => { await fetch('/api/auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'logout'}) }); router.push('/login') }}
            className="px-4 py-2 glass-card hover:border-red-500 transition text-sm text-red-400">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="TOTAL REQUESTS" value={stats.totalRequests.toLocaleString()} />
        <StatCard label="TOTAL TOKENS" value={formatTokens(stats.totalTokens)} />
        <StatCard label="COST (24H)" value={`$${stats.cost24h.toFixed(6)}`} />
        <StatCard label="ACTIVE KEYS" value={stats.activeKeys.toString()} />
      </div>

      {/* Top Models */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">TOP MODELS (24H)</h2>
          {stats.topModels.length === 0 ? (
            <p className="text-gray-500 text-sm">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topModels.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-mono">{m.model}</span>
                  <span className="text-sm text-brand-400">{m.count} req</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-Key Stats */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">PER-KEY STATS</h2>
          {stats.keyStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No keys created yet</p>
          ) : (
            <div className="space-y-4">
              {stats.keyStats.map((k, i) => (
                <div key={i} className="p-3 bg-[#0a0a0f] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-brand-900/50 text-brand-300 rounded">🔑</span>
                    <span className="text-sm font-medium">{k.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    <div>{k.requests_24h} req/24h</div>
                    <div>${k.total_cost.toFixed(6)}</div>
                    <div>{formatTokens(k.total_tokens)} tok</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}
