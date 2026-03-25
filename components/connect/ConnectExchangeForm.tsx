'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KrakenLogo } from '@/components/KrakenLogo'

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

    fetch('/api/sync', { method: 'POST' }).then(() => {
      router.refresh()
    })
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: '#4edea3', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <h2 className="text-white font-semibold mb-2">Kraken connected!</h2>
        <p className="text-sm mb-5" style={{ color: '#8c909f' }}>
          Your API keys are validated and encrypted. We&apos;re importing your trades now.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)', color: '#00285d' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>dashboard</span>
          View Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748b' }}>
          Select Provider
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button
            type="button"
            className="rounded-xl p-4 flex flex-col items-center gap-3 transition-all"
            style={{
              backgroundColor: 'rgba(59,130,246,0.10)',
              border: '1px solid rgba(59,130,246,0.30)',
            }}
          >
            <KrakenLogo size={40} />
            <span className="text-sm font-bold text-blue-400">Kraken</span>
          </button>
          <div
            className="rounded-xl p-4 flex flex-col items-center gap-3 opacity-50 cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(38,42,55,0.50)',
              border: '1px solid rgba(66,71,84,0.20)',
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#313442' }}>
              <span className="material-symbols-outlined" style={{ color: '#64748b', fontSize: '20px' }}>add</span>
            </div>
            <span className="text-sm font-medium" style={{ color: '#64748b' }}>More soon</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#64748b' }} htmlFor="apiKey">
            API Key
          </label>
          <input
            id="apiKey"
            type="text"
            placeholder="Enter your public key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            className="w-full rounded-lg px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
            style={{
              backgroundColor: '#313442',
              border: '1px solid rgba(66,71,84,0.20)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.30)'
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.50)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'rgba(66,71,84,0.20)'
            }}
          />
        </div>

        {/* API Secret */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#64748b' }} htmlFor="apiSecret">
            API Secret
          </label>
          <input
            id="apiSecret"
            type="password"
            placeholder="Enter your private secret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            required
            className="w-full rounded-lg px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
            style={{
              backgroundColor: '#313442',
              border: '1px solid rgba(66,71,84,0.20)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.30)'
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.50)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'rgba(66,71,84,0.20)'
            }}
          />
        </div>

        {/* Info box */}
        <div
          className="rounded-r-lg p-5"
          style={{ backgroundColor: '#171b28', borderLeft: '4px solid #3b82f6' }}
        >
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '20px' }}>info</span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Kraken Permissions Required</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#c2c6d6' }}>
                When creating your API key in Kraken settings, please ensure only{' '}
                <span className="text-blue-400 font-medium">Query Ledger</span> and{' '}
                <span className="text-blue-400 font-medium">Query Funds</span> are selected.
                Disable all withdrawal and trading permissions.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              color: '#ffb3ad',
              backgroundColor: 'rgba(255,180,173,0.08)',
              border: '1px solid rgba(255,180,173,0.15)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !apiKey || !apiSecret}
          className="w-full py-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)',
            color: '#001a42',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span>
          {loading ? 'Validating…' : 'Connect Kraken'}
        </button>
      </form>
    </div>
  )
}
