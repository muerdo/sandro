import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

type WebhookResponse = {
  received: boolean;
  type: string;
  error?: string;
};

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

type OrderUpdate = {
  status: OrderStatus;
  payment_status: PaymentStatus;
  updated_at: string;
  stripe_payment_intent_id: string;
  stripe_payment_method?: string;
  stripe_customer_id?: string;
};

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16'
});

// Initialize Supabase
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Utility Functions
const createResponse = (data: WebhookResponse, status: number = 200): Response => {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status
    }
  );
};

const updateOrder = async (orderId: string, update: OrderUpdate): Promise<void> => {
  const { error } = await supabaseClient
    .from('orders')
    .update(update)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

const sendAdminNotification = async (type: string, orderId: string, amount: number): Promise<void> => {
  await supabaseClient.functions.invoke('admin-operations', {
    body: {
      action: 'sendNotification',
      type,
      orderId,
      amount
    }
  });
};

const handlePaymentIntent = async (
  paymentIntent: Stripe.PaymentIntent,
  status: OrderStatus,
  paymentStatus: PaymentStatus
): Promise<void> => {
  try {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      throw new Error('No order ID found in payment intent metadata');
    }

    // Get payment method details
    const paymentMethod = paymentIntent.payment_method as string;
    const customer = paymentIntent.customer as string;

    // Update order with payment details
    await updateOrder(orderId, {
      status,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
      stripe_payment_method: paymentMethod,
      stripe_customer_id: customer
    });

    // Update inventory if payment successful
    if (status === 'completed') {
      const items = JSON.parse(paymentIntent.metadata.items || '[]');
      for (const item of items) {
        await supabaseClient
          .from('products')
          .update({ 
            stock: supabase.sql`stock - ${item.quantity}`,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_id', item.stripeId);
      }
    }

    // Send notifications
    if (status === 'completed' || status === 'cancelled') {
      await sendAdminNotification(
        status === 'completed' ? 'payment_success' : 'payment_failed',
        orderId,
        paymentIntent.amount / 100
      );

      // Send customer notification
      if (paymentIntent.metadata.customer_id) {
        await supabaseClient.functions.invoke('admin-operations', {
          body: {
            action: 'sendNotification',
            userId: paymentIntent.metadata.customer_id,
            type: status === 'completed' ? 'order_confirmed' : 'payment_failed',
            orderId
          }
        });
      }
    }

    console.log(`Order ${orderId} marked as ${status}`);
  } catch (error) {
    console.error('Error handling payment intent:', error);
    throw error;
  }
};

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
        await handlePaymentIntent(
          event.data.object as Stripe.PaymentIntent,
          'completed',
          'paid'
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntent(
          event.data.object as Stripe.PaymentIntent,
          'cancelled',
          'failed'
        );
        break;

      case 'payment_intent.processing':
        await handlePaymentIntent(
          event.data.object as Stripe.PaymentIntent,
          'processing',
          'processing'
        );
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntent(
          event.data.object as Stripe.PaymentIntent,
          'pending',
          'pending'
        );
        break;

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await handlePaymentIntent(
            { 
              ...charge,
              id: charge.payment_intent as string,
              metadata: charge.metadata
            } as Stripe.PaymentIntent,
            'cancelled',
            'refunded'
          );
        }
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntent(
          event.data.object as Stripe.PaymentIntent,
          'cancelled',
          'failed'
        );
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
