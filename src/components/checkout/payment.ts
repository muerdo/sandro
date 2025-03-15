export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total_amount: number
          items: Json
          shipping_address: Json | null
          payment_method: string
          payment_status: string
          stripe_payment_intent_id: string | null
          created_at: string | null
          updated_at: string | null
          estimated_delivery: string | null
          tracking_info: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          role: string | null
          full_name: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
      shipping_addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          phone: string
          address: string
          city: string
          state: string
          postal_code: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

export type PaymentMethod = 'card' | 'pix' | 'boleto';