// src/app/api/secret/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json(); // Recebe o valor total do carrinho

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Valor inválido ou ausente' },
        { status: 400 }
      );
    }

    // Crie um PaymentIntent para pagamento com cartão
    const cardPaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Valor em centavos (ex: R$ 10,00 = 1000)
      currency: 'brl', // Moeda: Real Brasileiro
      payment_method_types: ['card'], // Método de pagamento: Cartão
    });

    // Crie um PaymentIntent para pagamento com boleto
    const boletoPaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Valor em centavos (ex: R$ 10,99 = 1099)
      currency: 'brl', // Moeda: Real Brasileiro
      payment_method_types: ['boleto'], // Método de pagamento: Boleto
    });

    // Retorne os client_secrets
    return NextResponse.json({
      card_client_secret: cardPaymentIntent.client_secret,
      boleto_client_secret: boletoPaymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Erro ao criar PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Erro ao criar PaymentIntent' },
      { status: 500 }
    );
  }
}