import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check email allowlist if ALLOWED_EMAILS is set
      const allowedEmails = process.env.ALLOWED_EMAILS
      if (allowedEmails) {
        const { data: { user } } = await supabase.auth.getUser()
        const allowed = allowedEmails
          .split(',')
          .map((e) => e.trim().toLowerCase())
        if (!user?.email || !allowed.includes(user.email.toLowerCase())) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/auth?error=not_allowed`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to auth page with error
  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
