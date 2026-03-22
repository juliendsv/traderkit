import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">TraderKit</span>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-zinc-400 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Now in beta · Kraken integration live
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          The trading journal<br />
          <span className="text-emerald-400">built for crypto</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Connect your Kraken account and see your real trading performance.
          Win rate, P&amp;L, best setups — automatically. No spreadsheets.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors text-sm"
          >
            Start for free →
          </Link>
          <p className="text-zinc-500 text-sm">No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-12">Everything you need to improve</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {pricing.map((p) => (
            <div
              key={p.name}
              className={`bg-zinc-900 rounded-lg p-6 space-y-4 ${p.featured ? 'border-2 border-emerald-600' : 'border border-zinc-800'}`}
            >
              {p.featured && (
                <span className="text-xs font-medium bg-emerald-600 text-white px-2 py-0.5 rounded-full">Popular</span>
              )}
              <div>
                <h3 className="text-white font-bold text-lg">{p.name}</h3>
                <p className="text-3xl font-bold mt-1">
                  {p.price === 0 ? (
                    <span>Free</span>
                  ) : (
                    <span>${p.price}<span className="text-zinc-500 text-base font-normal">/mo</span></span>
                  )}
                </p>
              </div>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth"
                className={`block text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  p.featured
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-zinc-500 text-sm">
          <span>TraderKit © 2026</span>
          <span>Built for crypto traders</span>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: '⚡',
    title: 'Auto-import from Kraken',
    desc: 'Connect your API keys and trades sync automatically every 4 hours. No CSV exports, no manual entry.',
  },
  {
    icon: '📊',
    title: 'Real performance metrics',
    desc: 'Win rate, average win/loss, best tokens, P&L by day of week, current streak — all calculated automatically.',
  },
  {
    icon: '📅',
    title: 'Calendar heatmap',
    desc: 'See your profit and loss days at a glance. Green means profit, red means loss. Spot your patterns.',
  },
  {
    icon: '🔒',
    title: 'Read-only security',
    desc: 'TraderKit only needs read-only API keys. We encrypt them with AES-256-GCM. We can never trade on your behalf.',
  },
  {
    icon: '💹',
    title: 'FIFO P&L calculation',
    desc: 'Realized P&L is computed using FIFO cost basis — the same method your accountant uses.',
  },
  {
    icon: '🔄',
    title: 'Always up to date',
    desc: 'Vercel Cron syncs new trades every 4 hours automatically. Trigger manual sync anytime.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: 0,
    featured: false,
    cta: 'Get started',
    features: [
      '1 exchange',
      'Last 30 days of trades',
      'Basic dashboard',
      'Calendar view',
    ],
  },
  {
    name: 'Pro',
    price: 12,
    featured: true,
    cta: 'Start Pro trial',
    features: [
      'Unlimited exchanges',
      'Full trade history',
      'Trade notes & tags',
      'Tax export (CSV)',
      'Priority support',
    ],
  },
  {
    name: 'Trader',
    price: 19,
    featured: false,
    cta: 'Go Trader',
    features: [
      'Everything in Pro',
      'On-chain wallet import',
      'Shareable P&L cards',
      'AI trading insights',
      'Priority support',
    ],
  },
]
