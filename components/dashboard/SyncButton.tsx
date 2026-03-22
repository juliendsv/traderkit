'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

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
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="outline"
      size="sm"
      className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
    >
      {loading ? 'Syncing...' : 'Sync now'}
    </Button>
  )
}
