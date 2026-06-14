import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          location_lat: number | null
          location_lng: number | null
          green_credits: number
          amazon_member_since: number | null
          size_profile: Json | null
          sustainability_score: number
          created_at: string
        }
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          title: string
          category: string
          original_price: number
          asking_price: number
          purchase_date: string | null
          condition_grade: string
          condition_summary: string | null
          defects: string[] | null
          listing_type: string
          exchange_want: string | null
          images: string[] | null
          location_lat: number | null
          location_lng: number | null
          location_area: string | null
          status: string
          is_local_artisan: boolean
          meetpoint_locker_id: string | null
          serial_number: string | null
          resale_value_1yr: number | null
          triage_reasoning: string | null
          passport_qr_url: string | null
          created_at: string
        }
      }
      product_passport: {
        Row: {
          id: string
          serial_number: string
          listing_id: string | null
          owner_alias: string
          owned_from: string | null
          owned_until: string | null
          condition_at_transfer: string | null
          grade_at_transfer: string | null
          reason_for_transfer: string | null
          is_original_purchase: boolean
          ai_narrative: string | null
          created_at: string
        }
      }
      transactions: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          amount: number
          status: string
          meetpoint: string | null
          buyer_confirmed_at: string | null
          created_at: string
        }
      }
      green_credits_log: {
        Row: {
          id: string
          user_id: string
          action: string
          credits: number
          listing_id: string | null
          co2_saved_kg: number | null
          created_at: string
        }
      }
      messages: {
        Row: {
          id: string
          listing_id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
      }
    }
  }
}
