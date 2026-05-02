import { Suspense } from 'react'
import AuthCard from './AuthCard'

// Separate async server component so that reading searchParams (a request-time
// API) happens inside a Suspense boundary. This lets the outer page's static
// content (background, layout shell) prerender at build time while this part
// streams in per-request — required by cacheComponents mode.
async function AuthContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <AuthCard error={error} />
}

// Outer page is intentionally not async — nothing here accesses request-time
// data, so the full static shell can be prerendered.
export default function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
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
        {/* Fallback is the form with no error — identical to what most users
            see, so the transition when searchParams resolves is imperceptible. */}
        <Suspense fallback={<AuthCard />}>
          <AuthContent searchParams={searchParams} />
        </Suspense>
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
