import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConnectExchangeForm } from '@/components/connect/ConnectExchangeForm'

export default async function ConnectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: exchanges } = await supabase
    .from('exchanges')
    .select('id, exchange_name, is_active, last_synced_at, created_at')
    .eq('user_id', user.id)

  const krakenConnected = exchanges?.some((e) => e.exchange_name === 'kraken' && e.is_active)

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Connect Exchange</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Connect your exchange to auto-import trades
        </p>
      </div>

      {krakenConnected ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-white font-medium">Kraken connected</span>
          </div>
          {exchanges?.filter((e) => e.exchange_name === 'kraken').map((ex) => (
            <div key={ex.id} className="text-sm text-zinc-400 space-y-1">
              <p>Connected: {new Date(ex.created_at).toLocaleDateString()}</p>
              {ex.last_synced_at && (
                <p>Last synced: {new Date(ex.last_synced_at).toLocaleString()}</p>
              )}
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-zinc-500 text-sm">
              To reconnect with new API keys, delete this connection and add again.
            </p>
          </div>
        </div>
      ) : (
        <ConnectExchangeForm />
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-medium text-zinc-300">How to create a Kraken read-only API key</h3>
        <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
          <li>Log in to Kraken → Settings → API</li>
          <li>Click &quot;Add key&quot;</li>
          <li>Set key permissions: enable <strong className="text-zinc-300">Query Funds</strong> and <strong className="text-zinc-300">Query Open Orders & Trades</strong> only</li>
          <li>Do NOT enable any trading, withdrawal, or deposit permissions</li>
          <li>Copy the API key and secret — the secret is only shown once</li>
        </ol>
      </div>
    </div>
  )
}
