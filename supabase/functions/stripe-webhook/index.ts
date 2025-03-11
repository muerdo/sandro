import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import Stripe from 'npm:stripe@14.18.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Processing webhook event:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update order status
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_status: paymentIntent.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (updateError) {
          console.error('Error updating order:', updateError)
          return new Response('Error updating order', { status: 500 })
        }

        console.log('Successfully processed payment success for order:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent
        
        // Update order status to failed
        const { error: failureError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
            stripe_payment_status: failedPayment.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', failedPayment.id)

        if (failureError) {
          console.error('Error updating failed order:', failureError)
          return new Response('Error updating order', { status: 500 })
        }

        console.log('Processed payment failure for order:', failedPayment.id)
        break
      }

      case 'payment_intent.requires_action': {
        const pendingPayment = event.data.object as Stripe.PaymentIntent
        
        // Update order status to pending additional action
        const { error: pendingError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'pending',
            stripe_payment_status: pendingPayment.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', pendingPayment.id)

        if (pendingError) {
          console.error('Error updating pending order:', pendingError)
          return new Response('Error updating order', { status: 500 })
        }

        console.log('Updated order status to pending action:', pendingPayment.id)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string
        
        // Update order status to refunded
        const { error: refundError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'refunded',
            status: 'cancelled',
            stripe_payment_status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntentId)

        if (refundError) {
          console.error('Error updating refunded order:', refundError)
          return new Response('Error updating order', { status: 500 })
        }

        console.log('Processed refund for order:', paymentIntentId)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ 
      received: true,
      type: event.type
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`,
      { status: 400 }
    )
  }
})
