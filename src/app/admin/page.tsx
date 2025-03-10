"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { 
  Package2, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  AlertCircle 
} from "lucide-react";

type OrderStats = {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
};

type SalesData = {
  date: string;
  revenue: number;
  orders: number;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_revenue: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/'); // Redireciona se o usuário não estiver logado
      return;
    }

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      subscribeToOrders();
      fetchStats();
      fetchSalesData();
      fetchRecentOrders();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      router.push('/');
      return;
    }
  
    // Busca os metadados do usuário
    const { data: { user: currentUser }, error } = await supabase.auth.getUser();
  
    if (error || !currentUser?.user_metadata?.role || currentUser.user_metadata.role !== 'admin') {
      router.push('/'); // Redireciona se o usuário não for admin
      return;
    }
  
    setIsAdmin(true); // Define o usuário como administrador
  };

  const subscribeToOrders = () => {
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchStats();
        fetchRecentOrders();
        fetchSalesData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount');

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    const stats = {
      total_orders: data.length,
      pending_orders: data.filter(order => order.status === 'pending').length,
      completed_orders: data.filter(order => order.status === 'completed').length,
      total_revenue: data.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    };

    setStats(stats);
  };

  const fetchSalesData = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .order('created_at', { ascending: false })
      .limit(7);

    if (error) {
      console.error('Error fetching sales data:', error);
      return;
    }

    const salesData = data.map(order => ({
      date: format(new Date(order.created_at), 'MMM dd'),
      revenue: order.total_amount || 0,
      orders: 1
    }));

    setSalesData(salesData);
  };

  const fetchRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles (username)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent orders:', error);
      return;
    }

    setRecentOrders(data);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total_orders}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Package2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{stats.pending_orders}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Orders</p>
                <p className="text-2xl font-bold">{stats.completed_orders}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  R$ {stats.total_revenue.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-6 rounded-xl shadow-lg mb-8"
        >
          <h2 className="text-xl font-semibold mb-6">Sales Overview</h2>
          <div className="w-full h-[400px]">
            <BarChart
              width={1200}
              height={400}
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (R$)" />
              <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
            </BarChart>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 px-4 font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      {order.profiles?.username || 'Anonymous'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'completed' 
                          ? 'bg-green-500/10 text-green-500'
                          : order.status === 'pending'
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      R$ {order.total_amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}