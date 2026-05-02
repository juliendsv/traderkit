'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KrakenLogo } from '@/components/KrakenLogo'
import { BinanceLogo } from '@/components/BinanceLogo'

type ExchangeId = 'kraken' | 'binance' | 'binanceus' | 'binanceusdm' | 'coinbase'

const EXCHANGE_LABELS: Record<ExchangeId, string> = {
  kraken: 'Kraken',
  binance: 'Binance',
  binanceus: 'Binance US',
  binanceusdm: 'Binance Futures',
  coinbase: 'Coinbase',
}

type Step = { text: string; emphasis?: string }

const API_KEY_INSTRUCTIONS: Record<ExchangeId, {
  url: string
  urlLabel: string
  steps: Step[]
}> = {
  kraken: {
    url: 'https://www.kraken.com/u/security/api',
    urlLabel: 'Kraken API Management',
    steps: [
      { text: 'Click ', emphasis: 'Add key' },
      { text: 'Under Key Permissions, check only ', emphasis: 'Query Funds' },
      { text: 'Also check ', emphasis: 'Query Ledger Entries' },
      { text: 'Leave all trading and withdrawal boxes unchecked' },
      { text: 'Save and copy the key and private key' },
    ],
  },
  binance: {
    url: 'https://www.binance.com/en/my/settings/api-management',
    urlLabel: 'Binance API Management',
    steps: [
      { text: 'Click ', emphasis: 'Create API' },
      { text: 'Choose ', emphasis: 'System generated' },
      { text: 'Under Permissions, enable only ', emphasis: 'Enable Reading' },
      { text: 'Disable Spot & Margin Trading, Withdrawals, and everything else' },
      { text: 'Recommended: restrict to your IP address' },
      { text: 'Copy the API Key and Secret Key' },
    ],
  },
  binanceus: {
    url: 'https://www.binanceus.com/settings/api-management',
    urlLabel: 'Binance US API Management',
    steps: [
      { text: 'Click ', emphasis: 'Create API' },
      { text: 'Under Permissions, enable only ', emphasis: 'Can Read' },
      { text: 'Disable trading and withdrawal permissions' },
      { text: 'Recommended: restrict to your IP address' },
      { text: 'Copy the API Key and Secret Key' },
    ],
  },
  binanceusdm: {
    url: 'https://www.binance.com/en/my/settings/api-management',
    urlLabel: 'Binance API Management',
    steps: [
      { text: 'Click ', emphasis: 'Create API' },
      { text: 'Under Permissions, enable ', emphasis: 'Enable Reading' },
      { text: 'Also enable ', emphasis: 'Enable Futures' },
      { text: 'Disable Enable Spot & Margin Trading, Withdrawals, and all write actions' },
      { text: 'Recommended: restrict to your IP address' },
      { text: 'Copy the API Key and Secret Key' },
    ],
  },
  coinbase: {
    url: 'https://portal.cdp.coinbase.com/access/api',
    urlLabel: 'Coinbase Developer Platform',
    steps: [
      { text: 'Click ', emphasis: 'Create API Key' },
      { text: 'Under Permissions, enable only ', emphasis: 'View (read-only)' },
      { text: 'Do NOT enable Trade, Transfer, or any write permissions' },
      { text: 'After creation, copy the ', emphasis: 'Key Name' },
      { text: 'Then click ', emphasis: 'Download private key' },
      { text: 'Paste the Key Name above and the full private key (including -----BEGIN/END lines) below' },
    ],
  },
}

function ApiKeyInstructions({ exchangeId, accentColor }: { exchangeId: ExchangeId; accentColor: string }) {
  const { url, urlLabel, steps } = API_KEY_INSTRUCTIONS[exchangeId]
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ backgroundColor: '#131720', border: '1px solid rgba(66,71,84,0.15)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>
            How to get your API key
          </p>
          <p className="text-sm font-semibold text-white">
            {EXCHANGE_LABELS[exchangeId]} API Settings
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>open_in_new</span>
          Open settings
        </a>
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {i + 1}
            </span>
            <span className="text-xs leading-relaxed" style={{ color: '#c2c6d6' }}>
              {step.text}
              {step.emphasis && (
                <span className="font-semibold" style={{ color: accentColor }}>{step.emphasis}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function ConnectExchangeForm() {
  const [selected, setSelected] = useState<'kraken' | 'binance_family' | 'coinbase' | null>(null)
  const [binanceVariant, setBinanceVariant] = useState<ExchangeId>('binance')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [connectedAs, setConnectedAs] = useState<ExchangeId | null>(null)
  const router = useRouter()

  const exchangeId: ExchangeId =
    selected === 'kraken' ? 'kraken' : selected === 'coinbase' ? 'coinbase' : binanceVariant

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/exchanges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exchange_name: exchangeId, api_key: apiKey, api_secret: apiSecret }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Connection failed')
      setLoading(false)
      return
    }

    setConnectedAs(exchangeId)
    setLoading(false)
    fetch('/api/sync', { method: 'POST' }).then(() => router.refresh())
  }

  if (connectedAs) {
    const label = EXCHANGE_LABELS[connectedAs]
    return (
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: '#4edea3', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <h2 className="text-white font-semibold mb-2">{label} connected!</h2>
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
        <div className="grid grid-cols-3 gap-4">
          {/* Kraken */}
          <button
            type="button"
            onClick={() => setSelected('kraken')}
            className="rounded-xl p-4 flex flex-col items-center gap-3 transition-all"
            style={{
              backgroundColor: selected === 'kraken' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.06)',
              border: selected === 'kraken' ? '1px solid rgba(59,130,246,0.55)' : '1px solid rgba(59,130,246,0.20)',
            }}
          >
            <KrakenLogo size={40} />
            <span className="text-sm font-bold text-blue-400">Kraken</span>
          </button>

          {/* Binance */}
          <button
            type="button"
            onClick={() => setSelected('binance_family')}
            className="rounded-xl p-4 flex flex-col items-center gap-3 transition-all"
            style={{
              backgroundColor: selected === 'binance_family' ? 'rgba(243,186,47,0.12)' : 'rgba(243,186,47,0.05)',
              border: selected === 'binance_family' ? '1px solid rgba(243,186,47,0.50)' : '1px solid rgba(243,186,47,0.15)',
            }}
          >
            <BinanceLogo size={40} />
            <span className="text-sm font-bold" style={{ color: '#f3ba2f' }}>Binance</span>
          </button>

          {/* Coinbase */}
          <button
            type="button"
            onClick={() => setSelected('coinbase')}
            className="rounded-xl p-4 flex flex-col items-center gap-3 transition-all"
            style={{
              backgroundColor: selected === 'coinbase' ? 'rgba(0,82,255,0.15)' : 'rgba(0,82,255,0.05)',
              border: selected === 'coinbase' ? '1px solid rgba(0,82,255,0.55)' : '1px solid rgba(0,82,255,0.20)',
            }}
          >
            {/* Coinbase "C" wordmark placeholder — no external SVG dependency */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black"
              style={{ backgroundColor: 'rgba(0,82,255,0.15)', color: '#0052FF' }}
            >
              C
            </div>
            <span className="text-sm font-bold" style={{ color: '#0052FF' }}>Coinbase</span>
          </button>
        </div>
      </div>

      {/* Binance variant sub-selector */}
      {selected === 'binance_family' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
            Binance Variant
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['binance', 'binanceus', 'binanceusdm'] as ExchangeId[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBinanceVariant(v)}
                className="rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: binanceVariant === v ? 'rgba(243,186,47,0.15)' : '#262a37',
                  border: binanceVariant === v ? '1px solid rgba(243,186,47,0.45)' : '1px solid rgba(66,71,84,0.20)',
                  color: binanceVariant === v ? '#f3ba2f' : '#8c909f',
                }}
              >
                {EXCHANGE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <>
          {/* How to get your API key */}
          <ApiKeyInstructions
            exchangeId={exchangeId}
            accentColor={
              selected === 'kraken' ? '#3b82f6' : selected === 'coinbase' ? '#0052FF' : '#f3ba2f'
            }
          />
        </>
      )}

      {selected && (
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
              style={{ backgroundColor: '#313442', border: '1px solid rgba(66,71,84,0.20)' }}
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

          {/* API Secret / Private Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#64748b' }} htmlFor="apiSecret">
              {exchangeId === 'coinbase' ? 'CDP Private Key' : 'API Secret'}
            </label>
            {exchangeId === 'coinbase' ? (
              <>
                <textarea
                  id="apiSecret"
                  placeholder={'-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                  rows={6}
                  spellCheck={false}
                  className="w-full rounded-lg px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all font-mono resize-none"
                  style={{ backgroundColor: '#313442', border: '1px solid rgba(66,71,84,0.20)' }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,82,255,0.30)'
                    e.currentTarget.style.borderColor = 'rgba(0,82,255,0.50)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'rgba(66,71,84,0.20)'
                  }}
                />
                <p className="text-[11px] mt-1.5 px-1" style={{ color: '#64748b' }}>
                  Paste the full private key including the -----BEGIN and -----END lines.
                </p>
              </>
            ) : (
              <input
                id="apiSecret"
                type="password"
                placeholder="Enter your private secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                style={{ backgroundColor: '#313442', border: '1px solid rgba(66,71,84,0.20)' }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.30)'
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.50)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(66,71,84,0.20)'
                }}
              />
            )}
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ color: '#ffb3ad', backgroundColor: 'rgba(255,180,173,0.08)', border: '1px solid rgba(255,180,173,0.15)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey || !apiSecret}
            className="w-full py-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              background:
                selected === 'kraken'
                  ? 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)'
                  : selected === 'coinbase'
                  ? 'linear-gradient(135deg, #5b8fff 0%, #0052FF 100%)'
                  : 'linear-gradient(135deg, #ffe066 0%, #f3ba2f 100%)',
              color: selected === 'coinbase' ? '#fff' : '#001a42',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span>
            {loading ? 'Validating…' : `Connect ${EXCHANGE_LABELS[exchangeId]}`}
          </button>
        </form>
      )}
    </div>
  )
}
