export interface UpdateOrderRequest {
  orderId: string;
  status: string;
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

// Deno is already declared in the global scope
