'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ConnectExchangeForm() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/exchanges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchange_name: 'kraken', api_key: apiKey, api_secret: apiSecret }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Connection failed')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Trigger initial sync
    fetch('/api/sync', { method: 'POST' }).then(() => {
      router.refresh()
    })
  }

  if (success) {
    return (
      <div className="bg-zinc-900 border border-emerald-800 rounded-lg p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="text-white font-semibold mb-2">Kraken connected!</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Your API keys are validated and encrypted. We&apos;re importing your trades now — this may take a moment.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          View Dashboard →
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-white font-semibold">Connect Kraken</h2>
        <p className="text-zinc-400 text-sm">
          Enter your Kraken read-only API keys. TraderKit only needs{' '}
          <strong className="text-zinc-300">Query Funds</strong> and{' '}
          <strong className="text-zinc-300">Query Open/Closed Orders and Trades</strong> permissions.
          Never grant withdrawal access.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey" className="text-zinc-300">API Key</Label>
        <Input
          id="apiKey"
          type="text"
          placeholder="your-kraken-api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiSecret" className="text-zinc-300">API Secret</Label>
        <Input
          id="apiSecret"
          type="password"
          placeholder="your-kraken-api-secret"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          required
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 font-mono text-sm"
        />
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-md p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={loading || !apiKey || !apiSecret}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          {loading ? 'Validating...' : 'Connect & Import Trades'}
        </Button>
      </div>

      <p className="text-zinc-500 text-xs">
        Your API keys are encrypted with AES-256-GCM before storage. They are never logged or exposed.
      </p>
    </form>
  )
}
