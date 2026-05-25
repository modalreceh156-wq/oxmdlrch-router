// Model pricing per 1M tokens (input/output)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
  'llama-4-scout': { input: 0, output: 0 },
  'llama-4-maverick': { input: 0, output: 0 },
  'qwen-2.5-72b': { input: 0, output: 0 },
  'mimo-v2.5-pro': { input: 0, output: 0 },
  'mimo-v2-flash': { input: 0, output: 0 },
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0, output: 0 }
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000
}

export interface Provider {
  name: string
  baseUrl: string
  apiKey?: string
  models: string[]
}

export const DEFAULT_PROVIDERS: Provider[] = [
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
  },
  {
    name: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-opus-4-20250514']
  },
  {
    name: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash']
  },
  {
    name: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['llama-4-scout', 'llama-4-maverick', 'qwen-2.5-72b', 'mimo-v2.5-pro', 'mimo-v2-flash']
  }
]
