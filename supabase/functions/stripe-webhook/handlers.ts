import type Stripe from 'stripe';
import { Dependencies, OrderStatus, PaymentStatus } from './types';
import { updateOrder, sendAdminNotification } from './utils';

export const handlePaymentIntent = async (
  deps: Dependencies,
  paymentIntent: Stripe.PaymentIntent,
  status: OrderStatus,
  paymentStatus: PaymentStatus
): Promise<void> => {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    throw new Error('No order ID found in payment intent metadata');
  }

  await updateOrder(deps, orderId, {
    status,
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
    stripe_payment_intent_id: paymentIntent.id
  });

  if (status === 'completed' || status === 'cancelled') {
    await sendAdminNotification(
      deps,
      status === 'completed' ? 'payment_success' : 'payment_failed',
      orderId,
      paymentIntent.amount / 100
    );
  }

  console.log(`Order ${orderId} marked as ${status}`);
};
