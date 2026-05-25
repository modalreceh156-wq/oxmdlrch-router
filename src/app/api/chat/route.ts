import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateCost } from '@/lib/providers'

export async function POST(req: NextRequest) {
  try {
    // Get API key from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }
    const apiKey = authHeader.replace('Bearer ', '')

    // Validate key
    const keyRow = db.prepare('SELECT * FROM api_keys WHERE key = ? AND is_active = 1').get(apiKey) as any
    if (!keyRow) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body = await req.json()
    const { model, messages, temperature, max_tokens, stream } = body

    // Get provider config
    const provider = db.prepare('SELECT * FROM providers WHERE name = ? AND is_active = 1').get(keyRow.provider) as any
    if (!provider) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 500 })
    }

    const targetModel = model || keyRow.model || 'gpt-4o-mini'
    const startTime = Date.now()

    // Forward request to provider
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

    // Stream response
    if (stream) {
      const latency = Date.now() - startTime
      // Log basic request (tokens counted after stream ends)
      db.prepare(`
        INSERT INTO requests (api_key_id, model, provider, latency_ms, status)
        VALUES (?, ?, ?, ?, 'success')
      `).run(keyRow.id, targetModel, keyRow.provider, latency)

      return new Response(providerResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Non-stream response
    const data = await providerResponse.json()
    const latency = Date.now() - startTime
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const cost = calculateCost(targetModel, usage.prompt_tokens, usage.completion_tokens)

    // Log request
    db.prepare(`
      INSERT INTO requests (api_key_id, model, provider, prompt_tokens, completion_tokens, total_tokens, cost, latency_ms, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success')
    `).run(keyRow.id, targetModel, keyRow.provider, usage.prompt_tokens, usage.completion_tokens, usage.total_tokens, cost, latency)

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 })
  }
}
