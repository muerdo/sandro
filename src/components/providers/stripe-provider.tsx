"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OvCwbHVHYGBPxXPPXJKgGZBXxhVxZXDGBBBvyXmEFBBBvyXmE');

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing Stripe publishable key');
}

if (!stripePromise) {
  console.error('Failed to initialize Stripe');
}

export function StripeProvider({ children }: { children: ReactNode }) {
  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={{
      locale: 'pt-BR',
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#18181B',
        },
      },
    }}>
      {children}
    </Elements>
  );
}
