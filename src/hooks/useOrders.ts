"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Order } from "@/types/admin";

export function useOrders() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const subscribeToOrders = useCallback(() => {
    return supabase
      .channel('orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchRecentOrders();
      })
      .subscribe();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (username)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentOrders(data?.map(order => ({
        ...order,
        status: order.status as OrderStatus,
        payment_status: order.payment_status as PaymentStatus,
        payment_method: order.payment_method as PaymentMethod
      })) || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      toast.error('Failed to load recent orders');
    }
  };

  return {
    recentOrders,
    subscribeToOrders,
    fetchRecentOrders
  };
}
