import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16'
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!webhookSecret) {
      throw new Error('Missing Stripe webhook secret');
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Get the raw body
    const rawBody = await req.text();

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Get order details from metadata
        const orderId = paymentIntent.metadata.orderId;
        if (!orderId) {
          throw new Error('No order ID found in payment intent metadata');
        }

        // Update order status to completed
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ 
            status: 'completed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }

        // Send notification to admin
        await supabaseClient.functions.invoke('admin-operations', {
          body: {
            action: 'sendNotification',
            type: 'payment_success',
            orderId: orderId,
            amount: paymentIntent.amount / 100
          }
        });

        console.log(`Order ${orderId} marked as completed`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        
        if (!orderId) {
          throw new Error('No order ID found in payment intent metadata');
        }

        // Update order status to cancelled
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ 
            status: 'cancelled',
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }

        // Send notification to admin
        await supabaseClient.functions.invoke('admin-operations', {
          body: {
            action: 'sendNotification',
            type: 'payment_failed',
            orderId: orderId,
            amount: paymentIntent.amount / 100
          }
        });

        console.log(`Order ${orderId} marked as cancelled due to payment failure`);
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        
        if (!orderId) {
          throw new Error('No order ID found in payment intent metadata');
        }

        // Update order status to processing
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ 
            status: 'processing',
            payment_status: 'processing',
            updated_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }

        console.log(`Order ${orderId} marked as processing`);
        break;
      }

      case 'payment_intent.requires_action': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        
        if (!orderId) {
          throw new Error('No order ID found in payment intent metadata');
        }

        // Update order status to pending
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ 
            status: 'pending',
            payment_status: 'pending',
            updated_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }

        console.log(`Order ${orderId} marked as pending, requires additional action`);
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        received: true,
        type: event.type
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: 'webhook_error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
