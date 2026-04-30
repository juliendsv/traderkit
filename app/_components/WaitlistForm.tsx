'use client'

import { useActionState, useEffect, useRef } from 'react'
import { joinWaitlist, WaitlistState } from '@/app/actions/waitlist'

const initialState: WaitlistState = { success: false }

// Safe wrapper — fires only if the Umami script has loaded
function umamiTrack(eventName: string, data?: Record<string, string>) {
  if (
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (window as any).umami?.track === 'function'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).umami.track(eventName, data)
  }
}

export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, initialState)
  // Capture the submitted email so we can read the domain after the component
  // switches to the success state (where the input no longer exists in the DOM)
  const submittedEmailRef = useRef<string>('')

  useEffect(() => {
    if (state.success) {
      const domain = submittedEmailRef.current.split('@')[1] ?? ''
      umamiTrack('waitlist_signup', { email_domain: domain })
    }
  }, [state.success])

  if (state.success) {
    return (
      <div className="flex items-center justify-center gap-2 text-[#4edea3] font-semibold text-lg">
        <span>✓</span>
        <span>You&apos;re on the list! We&apos;ll be in touch.</span>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Capture email before the action fires; don't preventDefault — that
    // would prevent the server action from running.
    submittedEmailRef.current =
      (new FormData(e.currentTarget).get('email') as string | null)?.trim() ?? ''
    umamiTrack('waitlist_attempt')
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <form action={action} onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="flex-grow bg-[#1b1f2c] border border-[#424754]/50 rounded-md px-4 py-3 text-white placeholder:text-[#8c909f] focus:outline-none focus:border-[#adc6ff]/50 transition-colors"
        />
        <button
          type="submit"
          disabled={pending}
          style={{ background: 'linear-gradient(135deg, #adc6ff, #4d8eff)' }}
          className="px-6 py-3 rounded-md font-bold text-[#00285d] disabled:opacity-60 transition-opacity whitespace-nowrap"
        >
          {pending ? 'Joining...' : 'Join the waitlist'}
        </button>
      </form>
      {state.error && (
        <p className="text-red-400 text-sm text-center">{state.error}</p>
      )}
    </div>
  )
}
