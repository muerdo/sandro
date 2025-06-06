import { PaymentMethod } from "@/types/index";
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  total_customers: number;
  average_order_value: number;
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  inventory?: {
    alerts: InventoryAlert[];
    recentUpdates: InventoryUpdate[];
  };
}
export interface OrderCreate {
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  items: OrderItem[];
  shipping_address_id: string;
  transaction_id?: string;
}
export interface OrderResponse {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  items: OrderItem[];
  shipping_address_id: string;
  created_at: string;
  updated_at: string;
  shipping_address?: ShippingAddress;
  profiles?: {
    username: string;
  };
  transaction_id?: string;
}
export interface InventoryAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock';
  created_at: string;
  product: {
    name: string;
  };
}

export interface InventoryUpdate {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  change_amount: number;
  change_type: 'manual' | 'order' | 'restock';
  created_at: string;
  notes?: string;
  profiles?: {
    username: string;
  };
}

export interface DashboardState {
  loading: {
    stats: boolean;
    auth: boolean;
    inventory: boolean;
  };
  stats: OrderStats;
  inventory: {
    alerts: InventoryAlert[];
    recentUpdates: InventoryUpdate[];
  };
  isAdmin: boolean;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  unit_price: number;
  quantity: number;
  customization?: Record<string, any>;
}
export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface Order {
  user_details: any;
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  items: OrderItem[];
  shipping_address_id: string;
  shipping_address?: ShippingAddress;
  transaction_id?: string;
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

export interface ProductMedia {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  thumbnail?: string;
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
  status: string;
  low_stock_threshold: number;
  inventory_history?: InventoryUpdate[];
  media?: ProductMedia[];
}

export interface ProductWithInventory extends Product {
  low_stock_threshold: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  inventory_history?: Array<{
    id: string;
    product_id: string;
    previous_stock: number;
    new_stock: number;
    change_amount: number;
    change_type: 'manual' | 'order' | 'restock';
    created_at: string;
    notes?: string;
    profiles?: {
      username: string;
    };
  }>;
}

export interface InventoryHistoryEntry {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  change_amount: number;
  change_type: 'manual' | 'order' | 'restock';
  created_by: string;
  created_at: string;
}

export type { PaymentMethod };
