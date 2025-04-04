export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      auth_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          id: number
          name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      data: {
        Row: {
          content: string | null
          created_at: string
          id: number
          sender: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          sender?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          sender?: string | null
        }
        Relationships: []
      }
      inventory_history: {
        Row: {
          change_amount: number | null
          change_date: string | null
          change_type: string | null
          created_at: string | null
          id: number
          new_stock: number | null
          notes: string | null
          previous_stock: number | null
          product_id: string
          quantity: number
          user_id: string | null
        }
        Insert: {
          change_amount?: number | null
          change_date?: string | null
          change_type?: string | null
          created_at?: string | null
          id?: number
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          product_id: string
          quantity: number
          user_id?: string | null
        }
        Update: {
          change_amount?: number | null
          change_date?: string | null
          change_type?: string | null
          created_at?: string | null
          id?: number
          new_stock?: number | null
          notes?: string | null
          previous_stock?: number | null
          product_id?: string
          quantity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_history_products"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_by: string | null
          direction: string | null
          id: number
          recipient: string | null
          sender: string | null
          status: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_by?: string | null
          direction?: string | null
          id?: number
          recipient?: string | null
          sender?: string | null
          status?: string | null
          timestamp: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_by?: string | null
          direction?: string | null
          id?: number
          recipient?: string | null
          sender?: string | null
          status?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          estimated_delivery: string | null
          id: string
          items: Json
          payment_method: string
          payment_status: string
          shipping_address: Json | null
          status: string
          total_amount: number
          tracking_info: Json | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          items?: Json
          payment_method: string
          payment_status: string
          shipping_address?: Json | null
          status: string
          total_amount: number
          tracking_info?: Json | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          items?: Json
          payment_method?: string
          payment_status?: string
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          tracking_info?: Json | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          bank_account: string
          bank_agency: string
          bank_name: string
          beneficiary_city: string | null
          beneficiary_name: string
          created_at: string | null
          id: string
          pix_key: string
          pix_key_type: string | null
          psp_url: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account: string
          bank_agency: string
          bank_name: string
          beneficiary_city?: string | null
          beneficiary_name: string
          created_at?: string | null
          id?: string
          pix_key: string
          pix_key_type?: string | null
          psp_url?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account?: string
          bank_agency?: string
          bank_name?: string
          beneficiary_city?: string | null
          beneficiary_name?: string
          created_at?: string | null
          id?: string
          pix_key?: string
          pix_key_type?: string | null
          psp_url?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_checkouts: {
        Row: {
          cart_items: Json
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          pix_code: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_transaction_id: string | null
          shipping_address: Json
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_items: Json
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: string
          pix_code?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_transaction_id?: string | null
          shipping_address: Json
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_items?: Json
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          pix_code?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_transaction_id?: string | null
          shipping_address?: Json
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pixtransactions: {
        Row: {
          amount: number
          createdat: string | null
          id: string
          pixcode: string
          qrcode: string
          status: string
          transactionid: string
          txid: string
          updatedat: string | null
          userid: string | null
        }
        Insert: {
          amount: number
          createdat?: string | null
          id?: string
          pixcode: string
          qrcode: string
          status: string
          transactionid: string
          txid: string
          updatedat?: string | null
          userid?: string | null
        }
        Update: {
          amount?: number
          createdat?: string | null
          id?: string
          pixcode?: string
          qrcode?: string
          status?: string
          transactionid?: string
          txid?: string
          updatedat?: string | null
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pixtransactions_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string | null
          customization: Json | null
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          low_stock_threshold: number | null
          name: string
          price: number
          status: string
          stock: number | null
          stripe_id: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          customization?: Json | null
          description?: string | null
          features?: string[] | null
          id: string
          images?: string[] | null
          low_stock_threshold?: number | null
          name: string
          price: number
          status: string
          stock?: number | null
          stripe_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          customization?: Json | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          status?: string
          stock?: number | null
          stripe_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_categories"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address: string
          city: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code: string
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          order_id: string | null
          phone_number: string
          sent_at: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          order_id?: string | null
          phone_number: string
          sent_at: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          order_id?: string | null
          phone_number?: string
          sent_at?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_with_dependencies: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      get_table_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          schema: string
          columns: Json
          row_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
