import { NextRequest, NextResponse } from 'next/server'
import { getDb, runQuery, runExec } from '@/lib/db'
import { calculateCost } from '@/lib/providers'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }
    const apiKey = authHeader.replace('Bearer ', '')

    const db = await getDb()
    const keys = runQuery(db, 'SELECT * FROM api_keys WHERE key = ? AND is_active = 1', [apiKey])
    if (keys.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    const keyRow = keys[0]

    const body = await req.json()
    const { model, messages, temperature, max_tokens, stream } = body

    const providers = runQuery(db, 'SELECT * FROM providers WHERE name = ? AND is_active = 1', [keyRow.provider])
    if (providers.length === 0) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 500 })
    }
    const provider = providers[0]

    const targetModel = model || keyRow.model || 'gpt-4o-mini'
    const startTime = Date.now()

    const providerResponse = await fetch(`${provider.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.api_key || keyRow.provider_key}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
        stream: stream ?? false,
      }),
    })

    if (!providerResponse.ok) {
      const err = await providerResponse.text()
      return NextResponse.json({ error: 'Provider error', details: err }, { status: providerResponse.status })
    }

    if (stream) {
      const latency = Date.now() - startTime
      runExec(db, `INSERT INTO requests (api_key_id, model, provider, latency_ms, status) VALUES (?, ?, ?, ?, 'success')`,
        [keyRow.id, targetModel, keyRow.provider, latency])
      return new Response(providerResponse.body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      })
    }

    const data = await providerResponse.json()
    const latency = Date.now() - startTime
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const cost = calculateCost(targetModel, usage.prompt_tokens, usage.completion_tokens)

    runExec(db, `INSERT INTO requests (api_key_id, model, provider, prompt_tokens, completion_tokens, total_tokens, cost, latency_ms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success')`,
      [keyRow.id, targetModel, keyRow.provider, usage.prompt_tokens, usage.completion_tokens, usage.total_tokens, cost, latency])

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 })
  }
}
