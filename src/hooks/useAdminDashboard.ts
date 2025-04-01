"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { InventoryAlert, InventoryUpdate, OrderStats, ProductWithInventory } from "@/types/admin";

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
      auth: true,
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
      inventory: { // Agora só aqui
        alerts: [],
        recentUpdates: [],
      },
    },
    isAdmin: false,
  });

  // Função para fazer login do admin
  const adminLogin = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: { ...prev.loading, auth: true } }));
      
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verifica se o usuário é um administrador
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.role !== "admin") {
        throw new Error("Not an admin user");
      }

      // Atualiza o estado e redireciona para o dashboard
      setState(prev => ({
        ...prev,
        isAdmin: true,
        loading: { ...prev.loading, auth: false }
      }));
      
      toast.success("Admin login successful");
      return true;
    } catch (error) {
      console.error("Admin login error:", error);
      setState(prev => ({ ...prev, loading: { ...prev.loading, auth: false } }));
      toast.error(error instanceof Error ? error.message : "Failed to login as admin");
      return false;
    }
  };

  // Verifica o status de admin
  const checkAdminStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: { ...prev.loading, auth: true } }));
      
      const { data: { session } } = await supabase.auth.getSession();
  
      if (!session?.user) {
        router.push("/login");
        return false;
      }
  
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
  
      if (error) throw error;
  
      if (profile?.role !== "admin") {
        throw new Error("Not an admin user");
      }
  
      setState(prev => ({
        ...prev,
        isAdmin: true,
        loading: { ...prev.loading, auth: false }
      }));
      
      return true;
    } catch (error) {
      console.error("Admin check error:", error);
      setState(prev => ({
        ...prev,
        isAdmin: false,
        loading: { ...prev.loading, auth: false }
      }));
      router.push("/");
      return false;
    }
  }, [router]);
  
  const fetchStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: { ...prev.loading, stats: true } }));
      
      const [
        { data: orders, error: ordersError },
        { data: products, error: productsError },
        { data: customers, error: customersError }
      ] = await Promise.all([
        supabase.from("orders").select("status, total_amount, user_id, created_at"),
        supabase.from("products").select(`
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
        `),
        supabase.from("profiles").select("id")
      ]);
  
      if (ordersError) throw ordersError;
      if (productsError) throw productsError;
      if (customersError) throw customersError;
  
      const uniqueCustomers = new Set(orders?.map((order) => order.user_id) || []);
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const averageOrderValue = orders?.length ? totalRevenue / orders.length : 0;
  
      const processedProducts = (products as unknown as ProductWithInventory[]) || [];
      const activeProducts = processedProducts.filter((p) => p.status === "active");
      const lowStockProducts = processedProducts.filter((p) => 
        p.stock !== null && p.stock <= (p.low_stock_threshold || 10)
      );
      const outOfStockProducts = processedProducts.filter((p) => 
        p.stock !== null && p.stock === 0
      );
  
      // Correção aplicada aqui
      const inventoryAlerts: InventoryAlert[] = processedProducts
        .filter(p => p.stock !== null && (p.stock === 0 || p.stock <= (p.low_stock_threshold || 10)))
        .map(p => ({
          id: p.id,
          product_id: p.id,
          alert_type: p.stock === 0 ? 'out_of_stock' : 'low_stock',
          created_at: new Date().toISOString(),
          product: {
            name: p.name
          }
        }));
  
      const recentInventoryUpdates: InventoryUpdate[] = processedProducts
        .flatMap(p => 
          p.inventory_history?.map(ih => ({
            ...ih,
            product_name: p.name
          })) || []
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
  
      setState(prev => ({
        ...prev,
        stats: {
          total_orders: orders?.length || 0,
          pending_orders: orders?.filter((order) => order.status === "pending").length || 0,
          completed_orders: orders?.filter((order) => order.status === "completed").length || 0,
          total_revenue: totalRevenue,
          total_customers: customers?.length || 0,
          average_order_value: averageOrderValue,
          total_products: processedProducts.length,
          active_products: activeProducts.length,
          low_stock_products: lowStockProducts.length,
          out_of_stock_products: outOfStockProducts.length,
          inventory: {
            alerts: inventoryAlerts,
            recentUpdates: recentInventoryUpdates,
          },
        },
        loading: {
          ...prev.loading,
          stats: false,
        },
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard statistics");
      setState(prev => ({
        ...prev,
        loading: {
          ...prev.loading,
          stats: false,
        },
      }));
    }
  }, []);
  
  // Inicialização do dashboard
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const isAdmin = await checkAdminStatus();
        if (isAdmin && mounted) {
          await fetchStats();
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        toast.error(error instanceof Error ? error.message : "Failed to initialize dashboard");
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [checkAdminStatus, fetchStats]);

  return {
    ...state,
    adminLogin,
    checkAdminStatus,
    fetchStats,
  };
}