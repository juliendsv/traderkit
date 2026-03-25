'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function getErrorMessage(code?: string): string {
  if (code === 'auth_failed') return 'Sign-in failed. Please try again.'
  if (code === 'not_allowed') return "This email isn't on the access list."
  return ''
}

export default function AuthCard({ error: initialError }: { error?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(() => getErrorMessage(initialError))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full flex flex-col">
      {/* Brand identity */}
      <div className="flex flex-col items-center mb-10">
        <a
          className="text-2xl font-bold text-white flex items-center justify-center gap-2 tracking-tight"
          href="/"
        >
          <span
            className="material-symbols-outlined text-[#3B82F6]"
            style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
          >
            candlestick_chart
          </span>
          <span>TraderKit</span>
        </a>
      </div>

      {/* Auth container */}
      <div
        className="rounded-xl p-6 md:p-10 shadow-2xl"
        style={{
          backgroundColor: '#0f1629',
          border: '1px solid rgba(66, 71, 84, 0.10)',
        }}
      >
        {sent ? (
          /* Sent state */
          <div className="text-center py-4">
            <div
              className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(77, 142, 255, 0.10)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: '#4d8eff', fontSize: '28px' }}
              >
                mail
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Check your email
            </h2>
            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              We sent a magic link to{' '}
              <span className="text-white">{email}</span>.
              <br />
              Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Sign in to TraderKit
              </h2>
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                We&apos;ll send a magic link to your inbox — no password needed.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <div
                  className="relative"
                  style={{ boxShadow: 'none' }}
                  onFocusCapture={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      'inset 0 0 0 2px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlurCapture={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                  }}
                >
                  <input
                    className="w-full h-12 rounded-lg px-4 text-white text-sm outline-none transition-all"
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      backgroundColor: '#141e35',
                      border: '1px solid #1a2340',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 0 0 2px rgba(173, 198, 255, 0.5)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm font-medium"
                  style={{
                    color: '#ffb3ad',
                    background: 'rgba(255, 180, 173, 0.08)',
                    border: '1px solid rgba(255, 180, 173, 0.15)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                className="w-full h-12 font-bold rounded-lg transition-transform active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                disabled={loading || !email}
                style={{
                  background: 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)',
                  color: '#00285d',
                }}
              >
                {loading ? 'Sending\u2026' : 'Send magic link'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8 flex items-center">
              <div
                className="flex-grow border-t"
                style={{ borderColor: 'rgba(66, 71, 84, 0.15)' }}
              />
              <span
                className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest"
                style={{ color: '#475569' }}
              >
                or
              </span>
              <div
                className="flex-grow border-t"
                style={{ borderColor: 'rgba(66, 71, 84, 0.15)' }}
              />
            </div>

            {/* Social buttons (ghost / coming soon) */}
            <div className="space-y-3">
              <button
                className="w-full h-12 flex items-center justify-center gap-3 rounded-lg text-sm font-semibold cursor-not-allowed opacity-50 bg-transparent transition-opacity"
                disabled
                style={{ border: '1px solid rgba(66, 71, 84, 0.20)', color: '#64748b' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  account_circle
                </span>
                Continue with Google
              </button>
            </div>

            {/* Fine print */}
            <div className="mt-8 text-center">
              <p
                className="text-[11px] leading-relaxed font-medium max-w-[280px] mx-auto"
                style={{ color: '#64748b' }}
              >
                By continuing you agree to our{' '}
                <a className="hover:underline transition-all" href="#" style={{ color: '#adc6ff' }}>
                  Terms
                </a>{' '}
                and{' '}
                <a className="hover:underline transition-all" href="#" style={{ color: '#adc6ff' }}>
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </>
        )}
      </div>

      {/* Back link */}
      <div className="mt-8 text-center">
        <a
          className="text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          href="/"
          style={{ color: '#64748b' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#adc6ff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            arrow_back
          </span>
          Back to marketing site
        </a>
      </div>
    </div>
  )
}
