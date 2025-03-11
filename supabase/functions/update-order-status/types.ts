export interface UpdateOrderRequest {
  orderId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  estimatedDelivery?: string;
  trackingInfo?: {
    location?: string;
    status?: string;
    timestamp?: string;
  };
}

export interface Profile {
  id: string;
  role: string;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  success: boolean;
}
