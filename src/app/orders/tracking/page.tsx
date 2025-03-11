"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { 
  Package2,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

interface OrderStatus {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  estimated_delivery: string | null;
  tracking_info: {
    location?: string;
    status?: string;
    timestamp?: string;
  };
}

export default function OrderTrackingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch initial orders
    fetchOrders();

    // Subscribe to order updates
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setOrders(currentOrders => 
          currentOrders.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new }
              : order
          )
        );
        
        // Show toast notification for status updates
        if (payload.new.status !== payload.old.status) {
          toast.success(`Order ${payload.new.id.slice(0, 8)} status updated to ${payload.new.status}`);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data?.map(order => ({
        id: order.id,
        status: order.status as OrderStatus['status'],
        created_at: order.created_at,
        updated_at: order.updated_at,
        estimated_delivery: order.estimated_delivery,
        tracking_info: {
          location: order.tracking_info?.location as string | undefined,
          status: order.tracking_info?.status as string | undefined,
          timestamp: order.tracking_info?.timestamp as string | undefined
        }
      })) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'processing':
        return <Package2 className="w-6 h-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-6 h-6 text-primary" />;
      case 'delivered':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Package2 className="w-6 h-6 text-muted-foreground" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please log in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Order Tracking</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
            <p className="text-muted-foreground">
              You haven't placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Order ID: {order.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Placed on: {format(new Date(order.created_at), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.tracking_info?.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{order.tracking_info.location}</span>
                    </div>
                  )}
                  
                  {order.estimated_delivery && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Estimated Delivery: {format(new Date(order.estimated_delivery), 'PPP')}
                      </span>
                    </div>
                  )}

                  {/* Status Timeline */}
                  <div className="relative pt-8">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-muted" />
                    {['pending', 'processing', 'shipped', 'delivered'].map((step, index) => (
                      <div
                        key={step}
                        className={`relative flex items-center gap-4 pb-8 ${
                          ['cancelled'].includes(order.status) && step !== order.status
                            ? 'opacity-50'
                            : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          order.status === step
                            ? 'bg-primary text-primary-foreground'
                            : ['cancelled'].includes(order.status)
                            ? 'bg-destructive/10 text-destructive'
                            : index <= ['pending', 'processing', 'shipped', 'delivered']
                                .indexOf(order.status)
                              ? 'bg-primary/80 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{step}</p>
                          {order.tracking_info?.status === step && (
                            <p className="text-sm text-muted-foreground">
                              {order.tracking_info.timestamp && 
                                format(new Date(order.tracking_info.timestamp), 'PPp')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
