'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncButton({ hasExchange }: { hasExchange: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!hasExchange) return null

  async function handleSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (data.trades_imported > 0) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
      style={{
        border: '1px solid rgba(173,198,255,0.20)',
        color: '#adc6ff',
      }}
      onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(173,198,255,0.05)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
      {loading ? 'Syncing…' : 'Sync now'}
    </button>
  )
}
