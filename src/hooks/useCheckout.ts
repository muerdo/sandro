import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { 
  ShippingAddress, 
  OrderItem, 
  OrderCreate, 
  OrderResponse,
  PaymentMethod,
  PaymentStatus,
  OrderStatus
} from "@/types/admin";
import { useCart } from "@/contexts/cart-context";
import { toast } from "sonner";

// Tipo para conversão segura com Supabase
type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json | undefined } 
  | Json[];

// Tipo explícito para pedido no formato Supabase
interface SupabaseOrder {
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  items: Json; // Explicitamente Json para Supabase
  shipping_address_id: string;
  transaction_id?: string;
}

export const useCheckout = () => {
  const { items: cartItems, total: cartTotal, clearCart } = useCart();
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Converte OrderCreate para formato Supabase
   */
  const toSupabaseOrder = (order: OrderCreate): SupabaseOrder => {
    return {
      user_id: order.user_id,
      status: order.status,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      items: JSON.parse(JSON.stringify(order.items)) as Json,
      shipping_address_id: order.shipping_address_id,
      ...(order.transaction_id && { transaction_id: order.transaction_id })
    };
  };
  /**
   * Obtém o usuário autenticado atual
   */
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error("Nenhum usuário autenticado encontrado");
      return user;
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      throw new Error("Falha ao verificar autenticação");
    }
  };

  /*
   * Salva o endereço de entrega
   */
  const saveShippingAddress = useCallback(async (
    address: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<ShippingAddress> => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error: supabaseError } = await supabase
        .from('shipping_addresses')
        .insert({
          ...address,
          user_id: user.id,
          is_default: address.is_default ?? false
        })
        .select('*')
        .single();

      if (supabaseError) throw supabaseError;
      if (!data) throw new Error("Endereço não foi salvo");
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar endereço";
      setError(message);
      console.error("Error saving address:", err);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um pedido pendente
   */
  const createPendingOrder = useCallback(async (
    addressId: string,
    paymentMethod: PaymentMethod | null = null
  ): Promise<OrderResponse> => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!cartItems.length) throw new Error("Carrinho vazio");

      const orderItems: OrderItem[] = cartItems.map(item => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        unit_price: item.price,
        quantity: item.quantity,
        customization: item.customization
      }));

      const orderData: OrderCreate = {
        user_id: user.id,
        status: 'pending',
        total_amount: cartTotal,
        payment_method: paymentMethod,
        payment_status: 'pending',
        items: orderItems,
        shipping_address_id: addressId
      };

      const { data, error: supabaseError } = await supabase
  .from('orders')
  .insert(toSupabaseOrder(orderData))
  .select(`
    id,
    user_id,
    status,
    total_amount,
    payment_method,
    payment_status,
    items,
    shipping_address_id,
    created_at,
    updated_at,
    shipping_address:shipping_address_id(*),
    profiles:user_id(username),
    transaction_id
  `)
  .single();

if (supabaseError) throw supabaseError;
if (!data) throw new Error("Pedido não foi criado");

      // Converter items de volta para OrderItem[]
      const orderResponse: OrderResponse = {
        ...data,
        items: data.items as OrderItem[],
        shipping_address: data.shipping_address as ShippingAddress | undefined,
        profiles: data.profiles ? { username: data.profiles.username } : undefined
      };

      setCurrentOrder(orderResponse);
      return orderResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar pedido";
      setError(message);
      console.error("Error creating order:", err);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [cartItems, cartTotal]);
  const updateOrderTransaction = async (orderId: string, transactionId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          transaction_id: transactionId,
          payment_method: 'pix',
          payment_status: 'processing'
        })
        .eq('id', orderId);
  
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error updating order transaction:", err);
      throw err;
    }
  };
  /**
   * Fluxo completo de checkout
   */
  const completeCheckout = useCallback(async (
    address: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    paymentMethod: PaymentMethod
  ): Promise<{
    order: OrderResponse;
    address: ShippingAddress;
  }> => {
    try {
      const savedAddress = await saveShippingAddress(address);
      const order = await createPendingOrder(savedAddress.id, paymentMethod);
      return { order, address: savedAddress };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao finalizar checkout";
      console.error("Checkout error:", err);
      throw new Error(message);
    }
  }, [saveShippingAddress, createPendingOrder]);

  return {
    currentOrder,
    loading,
    error,
    saveShippingAddress,
    createPendingOrder,
    completeCheckout,
    clearCart,
    updateOrderTransaction // Adicionado ao retorno
  };
};