"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

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
