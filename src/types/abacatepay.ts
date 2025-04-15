export interface AbacatePayCustomer {
  id: string;
  name: string;
  email: string;
  tax_id?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface AbacatePayBilling {
  id: string;
  customer_id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface AbacatePayPixData {
  transactionId: string;
  pixCode: string;
  qrCodeImage: string;
  expiresAt: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
}

export interface AbacatePayProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  images?: string[];
  features?: string;
  customization?: string;
  stock?: number;
  low_stock_threshold?: number;
}
