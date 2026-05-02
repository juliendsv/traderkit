import { getAllPosts } from '@/lib/blog'
import { CandlestickChart, Clock, ArrowRight, Tag } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://traderkit.xyz'),
  title: 'Blog — TraderKit',
  description: 'Articles on crypto trading, FIFO cost basis, and EU tax reporting.',
  alternates: { canonical: 'https://traderkit.xyz/blog' },
  openGraph: {
    title: 'Blog — TraderKit',
    description: 'Articles on crypto trading, FIFO cost basis, and EU tax reporting.',
    url: 'https://traderkit.xyz/blog',
    siteName: 'TraderKit',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-[#424754]/10">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
              <CandlestickChart className="text-[#3B82F6]" size={22} />
              TraderKit
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-[#8c909f] hover:text-white text-sm font-medium transition-colors">Features</Link>
<Link href="/blog" className="text-white text-sm font-medium transition-colors">Blog</Link>
            </div>
          </div>
          <Link
            href="/#about"
            style={{ background: 'linear-gradient(135deg, #adc6ff, #4d8eff)' }}
            className="px-5 py-2 rounded-md font-bold text-sm text-[#00285d]"
          >
            Join Waitlist
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Page header */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Blog</h1>
          <p className="text-[#8c909f] text-lg leading-relaxed">
            Crypto trading, cost-basis methods, and EU tax reporting — written for traders, not accountants.
          </p>
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <p className="text-[#8c909f]">No posts yet. Check back soon.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-8 rounded-md bg-[#1b1f2c] border border-[#424754]/10 hover:border-[#adc6ff]/30 transition-colors"
              >
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#adc6ff]/10 text-[#adc6ff]"
                      >
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-[#adc6ff] transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-[#8c909f] text-sm leading-relaxed mb-5">{post.excerpt}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[#8c909f] text-xs">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readingTime} min read
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[#adc6ff] text-xs font-semibold group-hover:gap-2 transition-all">
                    Read more <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
