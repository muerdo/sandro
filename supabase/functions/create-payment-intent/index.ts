import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import Stripe from 'npm:stripe@14.14.0'
import '../_shared/types'

// Type definitions
interface RequestPayload {
  items: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface SupabaseUser {
  id: string;
  email?: string;
}

interface AuthResponse {
  data: {
    user: SupabaseUser | null;
  };
  error: Error | null;
}

// Deno runtime type declarations
interface DenoRuntime {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
}

declare const Deno: DenoRuntime;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient(),
}) as unknown as Stripe

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  try {
    const payload = await req.json() as RequestPayload
    const { items, total, shippingDetails } = payload

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Get user ID from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Failed to get user information')
    }

    // Get or create Stripe customer
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profiles?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: shippingDetails.name,
        address: {
          line1: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          postal_code: shippingDetails.zipCode,
        },
        metadata: {
          supabase_uid: user.id,
        },
      })
      customerId = customer.id

      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'brl',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        shipping_name: shippingDetails.name,
        shipping_address: shippingDetails.address,
        shipping_city: shippingDetails.city,
        shipping_state: shippingDetails.state,
        shipping_zip: shippingDetails.zipCode,
      },
      shipping: {
        name: shippingDetails.name,
        address: {
          line1: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          postal_code: shippingDetails.zipCode,
        },
      }
    })

    // Create order record
    const { error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: total,
        items: items,
        shipping_address: shippingDetails,
        payment_method: 'credit_card',
        payment_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id
      })

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new Error('Failed to create order')
    }

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        customerId: customerId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
