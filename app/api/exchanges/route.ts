import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'
import { validateKrakenKeys } from '@/lib/ccxt/kraken'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { exchange_name, api_key, api_secret } = body

  if (!exchange_name || !api_key || !api_secret) {
    return NextResponse.json({ error: 'exchange_name, api_key, and api_secret are required' }, { status: 400 })
  }

  if (exchange_name !== 'kraken') {
    return NextResponse.json({ error: 'Only Kraken is supported in Phase 1' }, { status: 400 })
  }

  // Validate keys by making a test API call
  try {
    await validateKrakenKeys(api_key, api_secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'API key validation failed'
    return NextResponse.json({ error: `Invalid API keys: ${message}` }, { status: 400 })
  }

  // Encrypt and store
  const api_key_encrypted = encrypt(api_key)
  const api_secret_encrypted = encrypt(api_secret)

  const { data, error } = await supabase
    .from('exchanges')
    .upsert(
      {
        user_id: user.id,
        exchange_name,
        api_key_encrypted,
        api_secret_encrypted,
        is_active: true,
      },
      { onConflict: 'user_id,exchange_name' }
    )
    .select('id, exchange_name, created_at')
    .single()

  if (error) {
    console.error('Failed to save exchange:', error)
    return NextResponse.json({ error: 'Failed to save exchange connection' }, { status: 500 })
  }

  return NextResponse.json({ success: true, exchange: data })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('exchanges')
    .select('id, exchange_name, is_active, last_synced_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch exchanges' }, { status: 500 })
  }

  return NextResponse.json({ exchanges: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('exchanges')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete exchange' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
