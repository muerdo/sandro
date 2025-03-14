import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';
import { CORS_HEADERS, createResponse } from './utils';
import { handlePaymentIntent } from './handlers';

// Initialize dependencies
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16'
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const deps = { stripe, supabaseClient };

// Main webhook handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Missing Stripe webhook secret');
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntent(deps, event.data.object as Stripe.PaymentIntent, 'completed', 'paid');
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntent(deps, event.data.object as Stripe.PaymentIntent, 'cancelled', 'failed');
        break;

      case 'payment_intent.processing':
        await handlePaymentIntent(deps, event.data.object as Stripe.PaymentIntent, 'processing', 'processing');
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntent(deps, event.data.object as Stripe.PaymentIntent, 'pending', 'pending');
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createResponse({ received: true, type: event.type });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createResponse({ received: false, type: 'webhook_error', error: errorMessage }, 400);
  }
});
