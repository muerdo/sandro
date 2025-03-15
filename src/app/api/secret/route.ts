// src/app/api/secret/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
});

export async function GET() {
  try {
    // Crie ou busque um PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Valor em centavos (ex: R$ 10,00 = 1000)
      currency: 'brl', // Moeda: Real Brasileiro
      payment_method_types: ['card'], // Métodos de pagamento suportados
    });

    // Retorne o client_secret
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erro ao criar PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Erro ao criar PaymentIntent' },
      { status: 500 }
    );
  }
}