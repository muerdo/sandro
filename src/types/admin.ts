export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  items: any;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  features: string[];
  customization: any;
  created_at: string;
  updated_at: string;
  status?: string;
}
