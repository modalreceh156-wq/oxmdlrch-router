# oxmdlrch Router

AI Model Router — smart routing across multiple providers with usage tracking.

## Features
- Multi-provider routing (OpenAI, Anthropic, Google, DeepSeek, OpenRouter)
- API key management with per-key stats
- Real-time usage tracking (tokens, cost, latency)
- Dark glass-morphism dashboard
- OpenAI-compatible `/v1/chat/completions` endpoint

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/oxmdlrch/router)

1. Push to GitHub
2. Connect to Vercel
3. Deploy (zero config needed)

## API Usage

```bash
curl https://your-domain.vercel.app/api/chat \
  -H "Authorization: Bearer ox-your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Local Development

```bash
npm install
npm run dev
```

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- SQLite (better-sqlite3)
- JWT Auth
