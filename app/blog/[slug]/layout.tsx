import { getPost } from '@/lib/blog'
import { notFound } from 'next/navigation'
import { CandlestickChart, Clock, ArrowLeft, Tag, Calendar } from 'lucide-react'
import Link from 'next/link'
import { WaitlistForm } from '@/app/_components/WaitlistForm'

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

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
<Link href="/blog" className="text-[#8c909f] hover:text-white text-sm font-medium transition-colors">Blog</Link>
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

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#8c909f] hover:text-white text-sm font-medium transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back to Blog
        </Link>

        {/* Post header */}
        <header className="mb-12">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
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

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-[#8c909f] text-sm border-b border-[#424754]/20 pb-6">
            <span className="font-medium text-white">{post.author}</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {post.readingTime} min read
            </span>
          </div>
        </header>

        {/* MDX content */}
        <article className="prose prose-invert prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:text-[#b0b5c4] prose-p:leading-relaxed prose-a:text-[#adc6ff] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:text-[#b0b5c4] prose-code:text-[#adc6ff] prose-code:bg-[#1b1f2c] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-blockquote:border-l-[#4d8eff] prose-blockquote:text-[#8c909f] max-w-none">
          {children}
        </article>

        {/* CTA */}
        <section
          className="mt-20 pt-16 border-t border-[#424754]/20"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(77, 142, 255, 0.05) 0%, transparent 70%)' }}
        >
          <div className="text-center space-y-5">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#8c909f] uppercase">Early Access</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Be the first to know when we launch.
            </h2>
            <p className="text-[#8c909f] max-w-md mx-auto leading-relaxed">
              Join the waitlist and get notified the moment TraderKit opens to new traders — including EU tax reports.
            </p>
            <div className="pt-2">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#424754]/10 bg-[#0a0e1a] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#8c909f] text-sm">
          <div className="flex items-center gap-2 font-bold text-white">
            <CandlestickChart className="text-[#3B82F6]" size={18} />
            TraderKit
          </div>
          <span>© 2026 TraderKit</span>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
