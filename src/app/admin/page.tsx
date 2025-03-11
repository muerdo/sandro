"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types/admin";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { toast } from "sonner";
import { 
  Package2, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Users,
  MessageCircle,
  Mail,
  Check,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";

import { OrderStats } from '@/types/admin';

type SalesData = {
  date: string;
  revenue: number;
  orders: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [customerAcquisition, setCustomerAcquisition] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const { loading, stats, isAdmin, checkAdminStatus, fetchStats } = useAdminDashboard();
  const { recentOrders, subscribeToOrders, fetchRecentOrders } = useOrders();

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        if (isAdmin) {
          subscribeToOrders();
          await Promise.all([
            fetchStats(),
            fetchAnalyticsData(),
            fetchRecentOrders()
          ]);
        }
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        toast.error('Failed to load dashboard');
      }
    };

    initializeAdmin();
  }, [isAdmin, fetchStats]);

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        await checkAdminStatus();
        if (isAdmin) {
          subscribeToOrders();
          await Promise.all([
            fetchStats(),
            fetchAnalyticsData(),
            fetchRecentOrders()
          ]);
        }
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        toast.error('Failed to load dashboard');
      }
    };

    initializeAdmin();
  }, [isAdmin, fetchStats]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch sales data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          created_at,
          total_amount,
          items,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Process sales data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return format(date, 'MMM dd');
      }).reverse();

      const salesData = last7Days.map(date => {
        const dayOrders = orders?.filter(order => 
          format(new Date(order.created_at), 'MMM dd') === date
        ) || [];
        return {
          date,
          revenue: dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          orders: dayOrders.length
        };
      });

      setSalesData(salesData);

      // Process product performance
      const productSales: Record<string, { revenue: number; orders: number }> = {};
      orders?.forEach(order => {
        const items = order.items as any[];
        items?.forEach(item => {
          if (!productSales[item.name]) {
            productSales[item.name] = { revenue: 0, orders: 0 };
          }
          productSales[item.name].revenue += (item.price * item.quantity) || 0;
          productSales[item.name].orders += item.quantity || 0;
        });
      });

      setProductPerformance(Object.entries(productSales).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        orders: data.orders
      })));

      // Process customer acquisition
      const customersByMonth: Record<string, number> = {};
      const uniqueCustomers = new Set<string>();
      
      orders?.forEach(order => {
        const monthYear = format(new Date(order.created_at), 'MMM yyyy');
        if (!uniqueCustomers.has(order.user_id)) {
          uniqueCustomers.add(order.user_id);
          customersByMonth[monthYear] = (customersByMonth[monthYear] || 0) + 1;
        }
      });

      setCustomerAcquisition(Object.entries(customersByMonth)
        .map(([month, count]) => ({
          month,
          newCustomers: count
        }))
        .slice(-6));

      // Fetch category distribution
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('category');

      if (productsError) throw productsError;

      const categoryCount: Record<string, number> = {};
      products?.forEach(product => {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      });

      setCategoryDistribution(Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count
        })));

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    }
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchAnalyticsData}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Refresh Analytics
            <TrendingUp className="w-4 h-4" />
          </motion.button>
        </div>

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

          <Link href="/admin/customers" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.total_customers}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/products" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Package2 className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold">
                    {stats.active_products} / {stats.total_products}
                  </p>
                  <div className="mt-2 flex gap-2 text-sm">
                    <span className="text-orange-500">
                      {stats.low_stock_products} Low Stock
                    </span>
                    <span className="text-destructive">
                      {stats.out_of_stock_products} Out of Stock
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Inventory Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-xl shadow-lg col-span-2"
          >
            <h2 className="text-xl font-semibold mb-6">Inventory Alerts</h2>
            <div className="space-y-4">
              {state.inventory.alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      alert.alert_type === 'out_of_stock' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.alert_type === 'out_of_stock' 
                          ? 'Out of Stock' 
                          : 'Low Stock Alert'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Handle restock action
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                  >
                    Restock
                  </motion.button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-xl shadow-lg col-span-2"
          >
            <h2 className="text-xl font-semibold mb-6">Sales Overview</h2>
            <div className="w-full h-[400px]">
              <ComposedChart
                width={800}
                height={400}
                data={salesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="var(--chart-1)" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--chart-2)" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="right" dataKey="orders" fill="var(--chart-2)" name="Orders" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  name="Revenue (R$)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </div>
          </motion.div>

          {/* Product Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Product Performance</h2>
            <div className="w-full h-[400px]">
              <BarChart
                width={500}
                height={400}
                data={productPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="var(--chart-3)" name="Revenue (R$)" />
                <Bar dataKey="orders" fill="var(--chart-4)" name="Orders" />
              </BarChart>
            </div>
          </motion.div>

          {/* Customer Acquisition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Customer Acquisition</h2>
            <div className="w-full h-[400px]">
              <AreaChart
                width={500}
                height={400}
                data={customerAcquisition}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="var(--chart-5)"
                  fill="var(--chart-5)"
                  fillOpacity={0.3}
                  name="New Customers"
                />
              </AreaChart>
            </div>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-xl shadow-lg col-span-2"
          >
            <h2 className="text-xl font-semibold mb-6">Category Distribution</h2>
            <div className="w-full h-[400px]">
              <PieChart width={800} height={400}>
                <Pie
                  data={categoryDistribution}
                  cx={400}
                  cy={200}
                  labelLine={false}
                  outerRadius={150}
                  fill="var(--chart-1)"
                  dataKey="count"
                  nameKey="category"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`var(--chart-${(index % 5) + 1})`}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </motion.div>
        </div>

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
