export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

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
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  customization?: Record<string, any>;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

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
  status: string;
  low_stock_threshold: number;
  inventory_history?: InventoryUpdate[];
}

export interface ProductWithInventory extends Product {
  low_stock_threshold: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
}

export interface ProductWithInventory extends Product {
  low_stock_threshold: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
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
