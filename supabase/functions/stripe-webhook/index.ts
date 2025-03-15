import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Database } from '../_shared/database.types';

interface WebhookResponse {
  received: boolean;
  type: string;
  error?: string;
}

interface OrderUpdate {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  updated_at: string;
  stripe_payment_intent_id: string;
  stripe_payment_method?: string;
  stripe_customer_id?: string;
  tracking_info?: {
    status: string;
    location: string;
    timestamp: string;
    last_updated: string;
    notes?: string;
  };
}

interface InventoryUpdate {
  productId: string;
  quantity: number;
  type: 'order' | 'restock' | 'manual';
  notes?: string;
}

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia'
});

// Initialize Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
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
  try {
    const { error } = await supabaseClient
      .from('orders')
      .update({
        ...update,
        tracking_info: {
          ...update.tracking_info,
          last_updated: new Date().toISOString()
        }
      })
      .eq('id', orderId);

    if (error) throw error;

    // Log order update
    console.log(`Order ${orderId} updated:`, {
      status: update.status,
      payment_status: update.payment_status,
      tracking: update.tracking_info
    });

  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

const updateInventory = async (updates: InventoryUpdate[]): Promise<void> => {
  try {
    for (const update of updates) {
      await supabaseClient.functions.invoke('inventory-management', {
        body: {
          action: 'update_stock',
          productId: update.productId,
          quantity: update.quantity,
          type: update.type,
          notes: update.notes
        }
      });
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
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
  status: 'pending' | 'processing' | 'completed' | 'cancelled',
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> => {
  try {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      throw new Error('No order ID found in payment intent metadata');
    }

    console.log(`Processing payment intent ${paymentIntent.id} for order ${orderId}`);

    // Get order details to verify
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Prepare tracking info
    const trackingInfo = {
      status: status,
      location: 'Payment Processing Center',
      timestamp: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      notes: status === 'cancelled' ? 
        paymentIntent.last_payment_error?.message : 
        `Payment ${paymentStatus}`
    };

    // Update order status
    await updateOrder(orderId, {
      status: status === 'completed' ? 'processing' : status,
      payment_status: paymentStatus === 'completed' ? 'paid' : paymentStatus,
      updated_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
      stripe_payment_method: paymentIntent.payment_method as string,
      stripe_customer_id: paymentIntent.customer as string,
      tracking_info: trackingInfo
    });

    // Handle inventory updates
    if (status === 'processing' && order.items) {
      const inventoryUpdates: InventoryUpdate[] = order.items.map(item => ({
        productId: item.id,
        quantity: -item.quantity,
        type: 'order',
        notes: `Order ${orderId} payment completed`
      }));

      await updateInventory(inventoryUpdates);
    }

    // Send notifications
    await Promise.all([
      // Admin notification
      supabaseClient.functions.invoke('admin-operations', {
        body: {
          action: 'sendNotification',
          type: status === 'processing' ? 'payment_success' : 'payment_failed',
          orderId,
          amount: paymentIntent.amount / 100,
          status,
          tracking: trackingInfo
        }
      }),

      // Customer notification if available
      paymentIntent.metadata.customer_id ? 
        supabaseClient.functions.invoke('admin-operations', {
          body: {
            action: 'sendNotification',
            userId: paymentIntent.metadata.customer_id,
            type: status === 'processing' ? 'order_confirmed' : 'payment_failed',
            orderId,
            tracking: trackingInfo
          }
        }) : Promise.resolve()
    ]);

    console.log(`Order ${orderId} processing completed:`, {
      status,
      payment_status: paymentStatus,
      tracking: trackingInfo
    });

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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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
          'completed'
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
              id: charge.payment_intent as string,
              metadata: charge.metadata,
              amount: charge.amount,
              currency: charge.currency,
              status: 'succeeded'
            } as unknown as Stripe.PaymentIntent,
            'cancelled',
            'failed'
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
