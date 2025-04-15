"use client";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import abacatepay from "@/hooks/abacatepay";
import type { ShippingAddress } from "@/components/checkout/address-form";
import type { PaymentMethod } from "@/types";

export function useAbacatePayCheckout() {
  const [loading, setLoading] = useState(false);
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();

  const completeCheckout = async (
    shippingAddress: ShippingAddress,
    paymentMethod: PaymentMethod
  ) => {
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    if (!shippingAddress) {
      throw new Error("Endereço de entrega não fornecido");
    }

    if (items.length === 0) {
      throw new Error("Carrinho vazio");
    }

    try {
      setLoading(true);

      // 1. Criar cliente no AbacatePay (se necessário)
      const customerData = {
        name: shippingAddress.full_name,
        email: shippingAddress.email,
        tax_id: shippingAddress.document || "",
        phone: shippingAddress.phone || "",
        address: {
          street: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zip_code,
          country: "BR"
        }
      };

      const customer = await abacatepay.createCustomer(customerData);

      // 2. Criar pedido no Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_amount: total,
          items: items,
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
          payment_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_delivery: null,
          tracking_info: null
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error("Erro ao criar pedido: " + orderError?.message);
      }

      // 3. Criar cobrança no AbacatePay
      const billingData = {
        customer_id: customer.id,
        order_id: order.id,
        amount: total,
        currency: "BRL",
        payment_method: paymentMethod,
        description: `Pedido #${order.id}`,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price
        }))
      };

      const billing = await abacatepay.createBilling(billingData);

      // 4. Atualizar pedido com informações de pagamento
      await supabase
        .from("orders")
        .update({
          payment_status: "pending",
          abacatepay_billing_id: billing.id
        })
        .eq("id", order.id);

      // 5. Retornar dados necessários
      return {
        order,
        billing,
        customer
      };
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pedido");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    completeCheckout,
    loading,
    clearCart
  };
}
