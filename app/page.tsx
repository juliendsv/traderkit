import { CandlestickChart, Check, Zap, BarChart2, CalendarDays, Lock, TrendingUp, RefreshCw } from 'lucide-react'
import { WaitlistForm } from './_components/WaitlistForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-[#424754]/10">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
              <CandlestickChart className="text-[#3B82F6]" size={22} />
              TraderKit
            </a>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-[#8c909f] hover:text-white text-sm font-medium transition-colors">Features</a>
              <a href="#about" className="text-[#8c909f] hover:text-white text-sm font-medium transition-colors">About</a>
            </div>
          </div>
          <a
            href="#about"
            style={{ background: 'linear-gradient(135deg, #adc6ff, #4d8eff)' }}
            className="px-5 py-2 rounded-md font-bold text-sm text-[#00285d]"
          >
            Join Waitlist
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 text-center"
        style={{
          background: 'radial-gradient(circle at 50% -20%, rgba(77, 142, 255, 0.15) 0%, rgba(10, 14, 26, 0) 70%)',
        }}
      >
        <div className="max-w-4xl w-full space-y-8">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight">
            The trading journal<br />built for crypto.
          </h1>
          <p className="text-xl text-[#8c909f] max-w-2xl mx-auto font-medium leading-relaxed">
            Auto-import trades from your exchange. Track P&amp;L with FIFO precision. Know exactly where you stand.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-[#8c909f] text-sm font-medium">
            {trustBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <Check className="text-[#4edea3]" size={16} strokeWidth={3} />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-[#0f131f]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">Ditch the manual logging</h2>
            <p className="text-[#8c909f] whitespace-nowrap">We automates your workflow, you focus on making better trades.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-md bg-[#1b1f2c] border border-[#424754]/10 hover:border-[#adc6ff]/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-md bg-[#adc6ff]/10 text-[#adc6ff] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <f.icon size={22} />
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{f.title}</h3>
                <p className="text-[#8c909f] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Works With */}
      <section className="py-12 px-6 border-t border-[#424754]/10 bg-[#171b28]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#8c909f] uppercase mb-8">Works With</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {exchanges.map((ex) => (
              <div key={ex.name} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${ex.domain}&sz=64`}
                    alt={ex.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="text-xs font-bold text-white">{ex.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section
        id="about"
        className="py-24 px-6 relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(77, 142, 255, 0.08) 0%, rgba(10, 14, 26, 0) 70%)',
        }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#8c909f] uppercase">Early Access</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight whitespace-nowrap">
            Be the first to know when we launch.
          </h2>
          <p className="text-[#8c909f] text-lg">
            Join the waitlist and get notified the moment TraderKit opens to new traders.
          </p>
          <WaitlistForm />
          <div className="flex items-center justify-center gap-2 text-sm text-[#8c909f]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]" />
            </span>
            127 traders already on the list
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#424754]/10 bg-[#0a0e1a] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#8c909f] text-sm">
          <div className="flex items-center gap-2 font-bold text-white">
            <CandlestickChart className="text-[#3B82F6]" size={18} />
            TraderKit
          </div>
          <span>© 2026 TraderKit</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>

    </div>
  )
}

const trustBadges = ['Read-only API keys', 'FIFO cost basis', 'No spreadsheets']

const features = [
  {
    icon: Zap,
    title: 'Auto-import from Kraken',
    desc: 'Connect your API keys and trades sync automatically every 4 hours. No CSV exports, no manual entry.',
  },
  {
    icon: BarChart2,
    title: 'Real performance metrics',
    desc: 'Win rate, average win/loss, best tokens, P&L by day of week, current streak — all calculated automatically.',
  },
  {
    icon: CalendarDays,
    title: 'Calendar heatmap',
    desc: 'See your profit and loss days at a glance. Green means profit, red means loss. Spot your patterns.',
  },
  {
    icon: Lock,
    title: 'Read-only security',
    desc: 'TraderKit only needs read-only API keys. We encrypt them with AES-256-GCM. We can never trade on your behalf.',
  },
  {
    icon: TrendingUp,
    title: 'FIFO P&L calculation',
    desc: 'Realized P&L is computed using FIFO cost basis — the same method your accountant uses.',
  },
  {
    icon: RefreshCw,
    title: 'Always up to date',
    desc: 'Vercel Cron syncs new trades every 4 hours automatically. Trigger manual sync anytime.',
  },
]

const exchanges = [
  { name: 'Kraken', domain: 'kraken.com' },
  { name: 'Coinbase', domain: 'coinbase.com' },
  { name: 'Binance', domain: 'binance.com' },
]
