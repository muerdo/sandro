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

// Deno runtime type declarations
export interface DenoRuntime {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
}

declare global {
  const Deno: DenoRuntime;
}
