import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types/admin";

export const useOrders = () => {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          profiles:user_id (username)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribeToOrders = useCallback(() => {
    const subscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          fetchRecentOrders(); // Atualiza a lista quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchRecentOrders]);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  return {
    recentOrders,
    loading,
    error,
    fetchRecentOrders,
    subscribeToOrders
  };
};