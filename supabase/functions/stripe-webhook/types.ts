import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export type WebhookResponse = {
  received: boolean;
  type: string;
  error?: string;
};

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

export type OrderUpdate = {
  status: OrderStatus;
  payment_status: PaymentStatus;
  updated_at: string;
  stripe_payment_intent_id: string;
};

export type Dependencies = {
  stripe: Stripe;
  supabaseClient: SupabaseClient;
};
