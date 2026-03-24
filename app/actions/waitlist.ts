'use server'

import { createClient } from '@/lib/supabase/server'

export type WaitlistState = {
  success: boolean
  error?: string
}

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = formData.get('email')?.toString().trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('waitlist').insert({ email })

  if (error) {
    if (error.code === '23505') {
      // Already on the list — treat as success
      return { success: true }
    }
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
