import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import Stripe from 'npm:stripe@14.14.0'

// Deno runtime type declarations
interface DenoRuntime {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
}

declare const Deno: DenoRuntime;

interface PaymentRequestBody {
  items: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items, total, shippingAddress } = (await req.json()) as PaymentRequestBody

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Autenticação necessária')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Falha ao obter informações do usuário')
    }

    // Get or create Stripe customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: shippingAddress.full_name,
        address: {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
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
      },
      shipping: {
        name: shippingAddress.full_name,
        address: {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
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
        shipping_address: shippingAddress,
        payment_method: 'credit_card',
        payment_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id
      })

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError)
      throw new Error('Falha ao criar pedido')
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
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Ocorreu um erro inesperado' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
import { createClient } from '@supabase/supabase-js'
import Stripe from 'npm:stripe@12.18.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items, total, shippingAddress } = await req.json()

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Autenticação necessária')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Falha ao obter informações do usuário')
    }

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: total,
        items: items,
        shipping_address: shippingAddress,
        payment_method: 'credit_card',
        payment_status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError)
      throw new Error('Falha ao criar pedido')
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'brl',
      customer: order.stripe_customer_id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        order_id: order.id
      },
      shipping: {
        name: shippingAddress.full_name,
        address: {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
        },
      }
    })

    // Update order with payment intent ID
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id)

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
      throw new Error('Falha ao atualizar pedido')
    }

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        orderId: order.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Ocorreu um erro inesperado' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
