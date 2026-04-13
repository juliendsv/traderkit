'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/dashboard/assets', label: 'Assets', icon: 'pie_chart' },
  { href: '/dashboard/trades', label: 'Trades', icon: 'swap_horiz' },
  { href: '/dashboard/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/dashboard/connect', label: 'Connect', icon: 'extension' },
]

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-50 py-6 px-4" style={{ backgroundColor: '#1b1f2c' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <span className="material-symbols-outlined text-2xl" style={{ color: '#3B82F6', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            candlestick_chart
          </span>
          <span className="text-xl font-bold tracking-tight text-white">TraderKit</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-200 ${
                  active
                    ? 'text-blue-400 bg-blue-500/10 inner-glow-primary border-l-2 border-blue-500'
                    : 'text-slate-400 hover:bg-[#262a37] border-l-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="mt-auto pt-6 px-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">{userEmail}</span>
              <span className="text-[10px] text-slate-500">Pro Tier</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-white transition-colors p-1"
              title="Sign out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header
        className="lg:hidden fixed top-0 w-full z-40 flex items-center justify-between px-6 h-16"
        style={{
          backgroundColor: 'rgba(10, 14, 26, 0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl" style={{ color: '#3B82F6', fontVariationSettings: "'FILL' 1" }}>
            candlestick_chart
          </span>
          <span className="text-xl font-bold tracking-tight text-white">TraderKit</span>
        </div>
        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '22px' }}>sync</span>
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-4 z-50"
        style={{
          backgroundColor: 'rgba(15, 19, 31, 0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                active ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
