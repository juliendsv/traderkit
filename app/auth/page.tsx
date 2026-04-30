import { connection } from 'next/server'
import AuthCard from './AuthCard'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // connection() is the cacheComponents-compatible replacement for
  // `export const dynamic = 'force-dynamic'`. Everything below is excluded
  // from prerendering and rendered on each request — correct for an auth page.
  await connection()
  const { error } = await searchParams

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#0a0e1a', color: '#dfe2f3' }}
    >
      {/* Background radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, #3b82f6 0%, transparent 70%)' }}
      />

      <main className="relative z-10 w-full max-w-md px-6 py-12 md:px-0 flex flex-col">
        <AuthCard error={error} />
      </main>

      {/* Decorative bottom-right accent */}
      <div className="absolute bottom-10 right-10 opacity-10 hidden md:block">
        <span
          className="material-symbols-outlined text-[120px]"
          style={{ color: '#adc6ff', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48", fontSize: '120px' }}
        >
          trending_up
        </span>
      </div>
    </div>
  )
}
