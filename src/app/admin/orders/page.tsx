"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  MessageCircle,
  Eye,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/types/supabase";

// Interface para shipping_address (baseada no Checkout)
interface ShippingAddress {
  full_name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string; // Opcional, pois nem todos os endereços podem ter telefone
}

// Interface para itens do pedido (baseada no CartItem do cart-context)
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customization: null;
}

// Tipo ajustado para Order
type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  profiles?: { username: string | null };
  shipping_address: ShippingAddress | null; // Substitui Json | null
  items: OrderItem[]; // Substitui Json
};

type SortField = "created_at" | "total_amount" | "status";
type SortDirection = "asc" | "desc";

export default function OrdersManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verifica o status de admin
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/");
      return;
    }

    setIsAdmin(true);
  }, [user, router]);

  // Busca os pedidos
  const fetchOrders = useCallback(async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          profiles (username)
        `);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (dateRange.start) {
        query = query.gte("created_at", dateRange.start.toISOString());
      }
      if (dateRange.end) {
        query = query.lte("created_at", dateRange.end.toISOString());
      }

      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
      toast.success("Orders loaded successfully");
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    }
  }, [statusFilter, dateRange, sortField, sortDirection]);

  // Atualiza o status de um pedido
  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      try {
        setIsProcessing(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No authentication session");

        const { error } = await supabase
          .from("orders")
          .update({
            status,
            tracking_info: {
              status,
              timestamp: new Date().toISOString(),
              location: "Processing Center",
            },
          })
          .eq("id", orderId);

        if (error) throw error;

        toast.success(`Order status updated to ${status}`);
        fetchOrders();
        setSelectedOrder(null);
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update order status");
      } finally {
        setIsProcessing(false);
      }
    },
    [fetchOrders]
  );

  // Filtra os pedidos localmente
  const filteredOrders = useCallback(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.profiles?.username &&
          order.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  // Efeito para buscar pedidos ao carregar a página
  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      fetchOrders();
    }
  }, [checkAdminStatus, isAdmin, fetchOrders]);

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
        <h1 className="text-4xl font-bold mb-8">Orders Management</h1>

        {/* Filtros e Ordenação */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders by ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground"
            >
              <Filter className="w-4 h-4" />
              Filters
            </motion.button>

            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-4 py-2 rounded-lg border bg-background"
              >
                <option value="created_at">Date</option>
                <option value="total_amount">Amount</option>
                <option value="status">Status</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                className="p-2 rounded-lg bg-secondary text-secondary-foreground"
              >
                <ArrowUpDown className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-card rounded-lg border space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.start?.toISOString().split("T")[0] ?? ""}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          start: e.target.value ? new Date(e.target.value) : null,
                        }))
                      }
                      className="flex-1 px-4 py-2 rounded-lg border bg-background"
                    />
                    <input
                      type="date"
                      value={dateRange.end?.toISOString().split("T")[0] ?? ""}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          end: e.target.value ? new Date(e.target.value) : null,
                        }))
                      }
                      className="flex-1 px-4 py-2 rounded-lg border bg-background"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary/5">
                  <th
                    className="text-left py-4 px-6 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setSortField("created_at")}
                  >
                    Order ID {sortField === "created_at" && <ArrowUpDown className="inline w-4 h-4" />}
                  </th>
                  <th className="text-left py-4 px-6">Customer</th>
                  <th className="text-left py-4 px-6">Date</th>
                  <th
                    className="text-left py-4 px-6 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setSortField("total_amount")}
                  >
                    Amount {sortField === "total_amount" && <ArrowUpDown className="inline w-4 h-4" />}
                  </th>
                  <th className="text-left py-4 px-6">Payment</th>
                  <th
                    className="text-left py-4 px-6 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setSortField("status")}
                  >
                    Status {sortField === "status" && <ArrowUpDown className="inline w-4 h-4" />}
                  </th>
                  <th className="text-left py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders().map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="py-4 px-6 font-mono">{order.id.slice(0, 8)}...</td>
                    <td className="py-4 px-6">
                      {order.shipping_address?.full_name || order.profiles?.username || "Anonymous"}
                    </td>
                    <td className="py-4 px-6">
                      {format(new Date(order.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="py-4 px-6">R$ {order.total_amount.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.payment_status === "paid"
                            ? "bg-green-500/10 text-green-500"
                            : order.payment_status === "pending"
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : order.status === "pending"
                            ? "bg-orange-500/10 text-orange-500"
                            : order.status === "processing"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => setSelectedOrder(order)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-primary/10 text-primary rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        {order.shipping_address?.phone && (
                          <motion.a
                            href={`https://wa.me/${order.shipping_address.phone}?text=Olá! Sobre o pedido ${order.id.slice(0, 8)}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </motion.a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalhes do Pedido */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateOrderStatus}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </main>
  );
}

// Componente para o modal de detalhes do pedido
const OrderDetailsModal = ({
  order,
  onClose,
  onUpdateStatus,
  isProcessing,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  isProcessing: boolean;
}) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
    <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Order Details - {order.id.slice(0, 8)}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        <p>
          <strong>Customer:</strong>{" "}
          {order.shipping_address?.full_name || order.profiles?.username || "Anonymous"}
        </p>
        <p>
          <strong>Date:</strong> {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
        </p>
        <p>
          <strong>Total:</strong> R$ {order.total_amount.toFixed(2)}
        </p>
        <p>
          <strong>Payment Method:</strong> {order.payment_method}
        </p>
        <p>
          <strong>Payment Status:</strong> {order.payment_status}
        </p>
        <p>
          <strong>Order Status:</strong> {order.status}
        </p>
        <div>
          <strong>Shipping Address:</strong>
          {order.shipping_address ? (
            <ul className="list-disc pl-5">
              <li>{order.shipping_address.full_name}</li>
              <li>{order.shipping_address.email}</li>
              <li>{order.shipping_address.address}</li>
              <li>
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.zip_code}
              </li>
              {order.shipping_address.phone && <li>Phone: {order.shipping_address.phone}</li>}
            </ul>
          ) : (
            "N/A"
          )}
        </div>
        <div>
          <strong>Items:</strong>
          <ul className="list-disc pl-5">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.name} - {item.quantity} x R$ {item.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <button
          onClick={() => onUpdateStatus(order.id, "completed")}
          disabled={isProcessing || order.status === "completed"}
          className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-gray-400"
        >
          Mark as Completed
        </button>
        <button
          onClick={() => onUpdateStatus(order.id, "cancelled")}
          disabled={isProcessing || order.status === "cancelled"}
          className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:bg-gray-400"
        >
          Cancel Order
        </button>
      </div>
    </div>
  </div>
);