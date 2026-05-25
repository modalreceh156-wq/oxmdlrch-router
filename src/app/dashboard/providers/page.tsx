'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Provider {
  id: number
  name: string
  base_url: string
  is_active: number
  priority: number
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', baseUrl: '', apiKey: '', priority: '0' })
  const router = useRouter()

  useEffect(() => { loadProviders() }, [])

  async function loadProviders() {
    const res = await fetch('/api/providers')
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    setProviders(data.providers)
  }

  async function addProvider(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, priority: parseInt(form.priority) }),
    })
    setShowAdd(false)
    setForm({ name: '', baseUrl: '', apiKey: '', priority: '0' })
    loadProviders()
  }

  async function deleteProvider(id: number) {
    if (!confirm('Delete this provider?')) return
    await fetch('/api/providers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadProviders()
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-brand-400 text-sm hover:underline mb-2">← Dashboard</button>
          <h1 className="text-xl font-bold">Providers</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm font-medium transition">
          + Add Provider
        </button>
      </div>

      {showAdd && (
        <div className="glass-card p-6 mb-6">
          <form onSubmit={addProvider} className="grid md:grid-cols-2 gap-4">
            <input placeholder="Provider name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" required />
            <input placeholder="Base URL" value={form.baseUrl} onChange={e => setForm({...form, baseUrl: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" required />
            <input placeholder="API Key (optional)" value={form.apiKey} onChange={e => setForm({...form, apiKey: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" />
            <input placeholder="Priority (0-10)" type="number" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#1e293b] rounded-lg text-sm focus:outline-none focus:border-brand-500" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg text-sm transition">Add</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 glass-card hover:border-red-500 text-sm transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {providers.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">No providers configured.</div>
        ) : providers.map(p => (
          <div key={p.id} className="glass-card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">Priority: {p.priority}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 font-mono">{p.base_url}</div>
            </div>
            <button onClick={() => deleteProvider(p.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
