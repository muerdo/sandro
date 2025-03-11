import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { corsHeaders } from '../_shared/cors'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16'
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return new Response('Webhook signature or secret missing', { status: 400 })
    }

    // Get the raw body
    const body = await req.text()

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Update order status to paid
        await supabaseClient
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'processing'
          })
          .eq('payment_intent_id', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        // Update order status to failed
        await supabaseClient
          .from('orders')
          .update({ 
            payment_status: 'failed',
            status: 'cancelled'
          })
          .eq('payment_intent_id', failedPayment.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: unknown) {
    console.error('Error processing webhook:', err)
    const error = err as Error
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
