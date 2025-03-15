import { z } from "zod";

export const paymentMethodSchema = z.enum(['credit_card', 'pix', 'bank_slip']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const shippingAddressSchema = z.object({
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  postal_code: z.string().min(1, "CEP é obrigatório"),
  is_default: z.boolean().default(false)
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// Helper para compatibilidade com o Stripe
export interface StripeShippingAddress {
  name: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }
}

// Função helper para converter entre os formatos
export function convertToStripeAddress(address: ShippingAddress): StripeShippingAddress {
  return {
    name: address.full_name,
    address: {
      line1: address.address,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: 'BR'
    }
  };
}
