import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
});

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

const PaymentRequestBodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })
  ).nonempty(),
  total: z.number().min(0),
  shipping_address_id: z.string(),
  payment_method_types: z.array(z.string()).nonempty(),
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = PaymentRequestBodySchema.parse(req.body);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Falha ao obter informações do usuário');
    }

    const { data: shippingAddress, error: addressError } = await supabaseClient
      .from('shipping_addresses')
      .select('*')
      .eq('id', body.shipping_address_id)
      .single();

    if (addressError || !shippingAddress) {
      throw new Error('Endereço de entrega não encontrado');
    }

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: body.total,
        items: body.items,
        shipping_address: shippingAddress,
        payment_method: body.payment_method_types[0],
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      throw new Error('Falha ao criar pedido');
    }

    let paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(body.total * 100),
      currency: 'brl',
      payment_method_types: body.payment_method_types,
      metadata: {
        user_id: user.id,
        order_id: order.id,
      },
      shipping: {
        name: shippingAddress.full_name,
        address: {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: 'BR',
        },
      },
    };

    if (body.payment_method_types.includes('pix')) {
      paymentIntentData.payment_method_options = {
        pix: {
          expires_after_seconds: 3600,
        },
      };
    } else if (body.payment_method_types.includes('boleto')) {
      paymentIntentData.payment_method_options = {
        boleto: {
          expires_after_days: 3,
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    await supabaseClient
      .from('orders')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
    });
  }
}