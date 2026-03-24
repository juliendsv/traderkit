'use client'

import { useActionState } from 'react'
import { joinWaitlist, WaitlistState } from '@/app/actions/waitlist'

const initialState: WaitlistState = { success: false }

export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, initialState)

  if (state.success) {
    return (
      <div className="flex items-center justify-center gap-2 text-[#4edea3] font-semibold text-lg">
        <span>✓</span>
        <span>You&apos;re on the list! We&apos;ll be in touch.</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <form action={action} className="flex flex-col sm:flex-row gap-3">
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
