export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      exchanges: {
        Row: {
          id: string
          user_id: string
          exchange_name: string
          api_key_encrypted: string
          api_secret_encrypted: string
          is_active: boolean
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange_name: string
          api_key_encrypted: string
          api_secret_encrypted: string
          is_active?: boolean
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exchange_name?: string
          api_key_encrypted?: string
          api_secret_encrypted?: string
          is_active?: boolean
          last_synced_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          id: string
          user_id: string
          exchange_id: string
          external_id: string
          pair: string
          base_currency: string
          quote_currency: string
          side: 'buy' | 'sell'
          amount: number
          price: number
          fee: number
          fee_currency: string | null
          pnl: number | null
          pnl_currency: string | null
          opened_at: string
          closed_at: string | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange_id: string
          external_id: string
          pair: string
          base_currency: string
          quote_currency: string
          side: 'buy' | 'sell'
          amount: number
          price: number
          fee?: number
          fee_currency?: string | null
          pnl?: number | null
          pnl_currency?: string | null
          opened_at: string
          closed_at?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exchange_id?: string
          external_id?: string
          pair?: string
          base_currency?: string
          quote_currency?: string
          side?: 'buy' | 'sell'
          amount?: number
          price?: number
          fee?: number
          fee_currency?: string | null
          pnl?: number | null
          pnl_currency?: string | null
          opened_at?: string
          closed_at?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          id: string
          exchange_id: string
          status: 'success' | 'error'
          trades_imported: number
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exchange_id: string
          status: 'success' | 'error'
          trades_imported?: number
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          exchange_id?: string
          status?: 'success' | 'error'
          trades_imported?: number
          error?: string | null
          created_at?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          id: string
          user_id: string
          exchange_id: string
          external_id: string
          currency: string
          amount: number
          type: 'deposit' | 'withdrawal'
          status: string
          tx_hash: string | null
          address: string | null
          occurred_at: string
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exchange_id: string
          external_id: string
          currency: string
          amount: number
          type: 'deposit' | 'withdrawal'
          status: string
          tx_hash?: string | null
          address?: string | null
          occurred_at: string
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exchange_id?: string
          external_id?: string
          currency?: string
          amount?: number
          type?: 'deposit' | 'withdrawal'
          status?: string
          tx_hash?: string | null
          address?: string | null
          occurred_at?: string
          raw_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
