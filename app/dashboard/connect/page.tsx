import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConnectExchangeForm } from '@/components/connect/ConnectExchangeForm'
import { KrakenLogo } from '@/components/KrakenLogo'

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
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">Connect Exchange</h1>
        <div
          className="flex items-center gap-2 self-start px-4 py-2 rounded-full w-fit text-sm font-medium"
          style={{ backgroundColor: 'rgba(38,42,55,0.40)', color: '#c2c6d6' }}
        >
          <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>lock</span>
          Read-only API keys only — we never touch your funds.
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form card */}
        <section
          className="lg:col-span-7 rounded-2xl p-8"
          style={{
            backgroundColor: '#1b1f2c',
            border: '1px solid rgba(66,71,84,0.15)',
            boxShadow: 'inset 0 0 12px rgba(59,130,246,0.1)',
          }}
        >
          {krakenConnected ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <KrakenLogo size={40} />
                <div>
                  <p className="text-white font-semibold">Kraken connected</p>
                  <p className="text-[10px]" style={{ color: '#4edea3' }}>● Active</p>
                </div>
              </div>
              {exchanges?.filter((e) => e.exchange_name === 'kraken').map((ex) => (
                <div key={ex.id} className="text-sm space-y-1" style={{ color: '#8c909f' }}>
                  <p>Connected: {new Date(ex.created_at).toLocaleDateString()}</p>
                  {ex.last_synced_at && (
                    <p>Last synced: {new Date(ex.last_synced_at).toLocaleString()}</p>
                  )}
                </div>
              ))}
              <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(66,71,84,0.15)' }}>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  To reconnect with new API keys, delete this connection and add again.
                </p>
              </div>
            </div>
          ) : (
            <ConnectExchangeForm />
          )}
        </section>

        {/* Info panel */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#171b28' }}>
            <h3
              className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"
              style={{ color: '#64748b' }}
            >
              <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>security</span>
              Institutional Security
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#262a37' }}>
                  <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '20px' }}>enhanced_encryption</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">AES-256-GCM Encryption</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#c2c6d6' }}>
                    Your keys are encrypted before they even reach our database. We use industry-standard GCM mode for authenticated encryption.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#262a37' }}>
                  <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '20px' }}>visibility_off</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Read-Only Access</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#c2c6d6' }}>
                    TraderKit only reads your trade history. No trading, withdrawal, or deposit permissions are ever requested.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AES badge */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#171b28' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#64748b' }}>Secure Link</div>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#4edea3' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
              AES-256 Protected
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(66,71,84,0.10)' }}>
        <p className="text-xs font-medium" style={{ color: '#64748b' }}>Keys are encrypted with AES-256-GCM before storage.</p>
        <div className="flex items-center gap-6">
          <span className="text-[10px] uppercase font-bold" style={{ color: '#475569' }}>Security Docs</span>
          <span className="text-[10px] uppercase font-bold" style={{ color: '#475569' }}>Privacy Policy</span>
        </div>
      </footer>
    </div>
  )
}
