import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <div style={{ backgroundColor: '#0a0e1a', color: '#dfe2f3', minHeight: '100vh' }}>
      <Sidebar userEmail={user.email ?? ''} />
      <main className="min-h-screen pt-20 pb-24 lg:pt-8 lg:pb-8 lg:pl-72 px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
