export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'cancelled'
          total_amount: number
          payment_method: string
          payment_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          total_amount: number
          payment_method: string
          payment_status?: string
          created_at?: string
        }
        Update: {
          status?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          role: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
} 