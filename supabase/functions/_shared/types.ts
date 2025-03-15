import { z } from "zod";

export const paymentMethodSchema = z.enum(['card', 'pix', 'boleto']);

// Define um schema Zod para validação dos campos do endereço
export const shippingAddressSchema = z.object({
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  postal_code: z.string().min(8, "CEP inválido"),
  is_default: z.boolean().default(false)
});

export type ShippingAddressRequest = z.infer<typeof shippingAddressSchema>;

export interface PaymentRequestBody {
  items: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shipping_address_id: string; // ID do endereço de entrega existente
  payment_method_types: string[]; //Paymentmethod type is missing in edited code, fallback to original
  metadata: {
    order_id: string;
  };
}

export interface PaymentResponse {
  clientSecret: string;
  orderId: string;
}