'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApiKey {
  id: number
  name: string
  key: string
  provider: string
  model: string | null
  is_active: number
  requests_24h: number
  total_cost: number
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', provider: 'openrouter', providerKey: '', model: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => { loadKeys() }, [])

  async function loadKeys() {
    const res = await fetch('/api/keys')
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    setKeys(data.keys)
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setShowCreate(false)
    setForm({ name: '', provider: 'openrouter', providerKey: '', model: '' })
    loadKeys()
  }

  async function deleteKey(id: number) {
    if (!confirm('Delete this key?')) return
    await fetch('/api/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadKeys()
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-brand-400 text-sm hover:underline mb-2">← Dashboard</button>
          <h1 className="text-xl font-bold">API Keys</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-medium transition">
          + New Key
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Create New Key</h2>
          <form onSubmit={createKey} className="grid md:grid-cols-2 gap-4">
            <input placeholder="Key name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" required />
            <select value={form.provider} onChange={e => setForm({...form, provider: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500">
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="deepseek">DeepSeek</option>
            </select>
            <input placeholder="Provider API Key" value={form.providerKey} onChange={e => setForm({...form, providerKey: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" required />
            <input placeholder="Default model (optional)" value={form.model} onChange={e => setForm({...form, model: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm transition disabled:opacity-50">
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 glass-card hover:border-red-500 text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">No API keys yet. Create one to get started.</div>
        ) : keys.map(k => (
          <div key={k.id} className="glass-card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{k.name}</span>
                <span className="text-xs px-2 py-0.5 bg-brand-900/50 text-brand-300 rounded">{k.provider}</span>
                {k.model && <span className="text-xs text-gray-500">{k.model}</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono">{k.key.slice(0, 12)}...{k.key.slice(-4)}</div>
              <div className="text-xs text-gray-500 mt-1">{k.requests_24h} req/24h · ${k.total_cost.toFixed(6)} total</div>
            </div>
            <button onClick={() => deleteKey(k.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
