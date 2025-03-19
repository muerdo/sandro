"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStats, ProductWithInventory } from "@/types/admin";

interface DashboardState {
  loading: {
    stats: boolean;
    auth: boolean;
  };
  stats: OrderStats;
  isAdmin: boolean;
}

export function useAdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    loading: {
      stats: true,
      auth: true
    },
    stats: {
      total_orders: 0,
      pending_orders: 0,
      completed_orders: 0,
      total_revenue: 0,
      total_customers: 0,
      average_order_value: 0,
      total_products: 0,
      active_products: 0,
      low_stock_products: 0,
      out_of_stock_products: 0,
      inventory: {
        alerts: [],
        recentUpdates: []
      }
    },
    isAdmin: false
  });

  // Função para fazer login do admin
  const adminLogin = async (email: string, password: string) => {
    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verifica se o usuário é um administrador
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.role !== 'admin') {
        throw new Error('Not an admin user');
      }

      // Atualiza o estado e redireciona para o dashboard
      setState(prev => ({
        ...prev,
        isAdmin: true
      }));
      router.push('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Failed to login as admin');
      throw error;
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No user found');
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (profile?.role !== 'admin') {
        throw new Error('Not an admin user');
      }

      setState(prev => ({
        ...prev,
        isAdmin: true
      }));

      // Redireciona para o dashboard se for admin
      router.push('/admin');
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/'); // Redireciona para a landing page se não for admin
      throw error;
    }
  };

  const fetchStats = async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          status,
          total_amount,
          user_id,
          created_at
        `);

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          inventory_history (
            id,
            product_id,
            previous_stock,
            new_stock,
            change_amount,
            change_type,
            created_at,
            notes
          )
        `);

      if (ordersError) throw ordersError;
      if (productsError) throw productsError;

      const uniqueCustomers = new Set(orders?.map(order => order.user_id) || []);
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const averageOrderValue = orders?.length ? totalRevenue / orders.length : 0;

      // Process products data with type safety
      const processedProducts = (products as unknown as ProductWithInventory[]) || [];
      const activeProducts = processedProducts.filter(p => p.status === 'active');
      const lowStockProducts = processedProducts.filter(p => 
        p.stock <= (p.low_stock_threshold || 10)
      );
      const outOfStockProducts = processedProducts.filter(p => 
        p.stock === 0
      );

      setState(prev => ({
        ...prev,
        stats: {
          total_orders: orders?.length || 0,
          pending_orders: orders?.filter(order => order.status === 'pending').length || 0,
          completed_orders: orders?.filter(order => order.status === 'completed').length || 0,
          total_revenue: totalRevenue,
          total_customers: uniqueCustomers.size,
          average_order_value: averageOrderValue,
          total_products: processedProducts.length,
          active_products: activeProducts.length,
          low_stock_products: lowStockProducts.length,
          out_of_stock_products: outOfStockProducts.length,
          inventory: {
            alerts: [],
            recentUpdates: []
          }
        },
        loading: {
          ...prev.loading,
          stats: false
        }
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAdminStatus();
        await fetchStats();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        toast.error('Failed to initialize dashboard');
      } finally {
        setState(prev => ({
          ...prev,
          loading: {
            ...prev.loading,
            auth: false
          }
        }));
      }
    };

    initialize();
  }, []);

  return {
    ...state,
    adminLogin, // Exporta a função de login do admin
    checkAdminStatus,
    fetchStats
  };
}