import type { Product } from './product';

export interface StripePrice {
  id: string;
  unit_amount: number;
  active: boolean;
  metadata?: {
    default?: boolean;
  };
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  prices?: StripePrice[];
  metadata?: {
    category?: string;
    features?: string;
    customization?: string;
    stock?: string;
    low_stock_threshold?: string;
  };
}

export interface TransformedStripeProduct extends Omit<Product, 'image'> {
  image: string;
  media: Array<{
    type: 'image';
    url: string;
    alt: string;
  }>;
  stripeId: string;
}
