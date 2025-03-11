import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@13.10.0'

// deno-lint-ignore no-explicit-any
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
}) as any;

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_status: paymentIntent.status
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            payment_status: 'failed',
            stripe_payment_status: paymentIntent.status
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error updating failed order:', updateError);
          throw updateError;
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown Error',
        details: err instanceof Error ? err.stack : undefined
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
