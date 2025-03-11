"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

const stripePromise = loadStripe('pk_test_51OvCwbHVHYGBPxXPPXJKgGZBXxhVxZXDGBBBvyXmEFBBBvyXmEFBBBvyXmE');

export function StripeProvider({ children }: { children: ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
