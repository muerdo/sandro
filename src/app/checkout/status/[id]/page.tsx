"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import abacatepay from "@/hooks/abacatepay";
import { supabase } from "@/lib/supabase";

export default function PaymentStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    status: string;
    payment_method: string;
    amount: number;
    created_at: string;
    billing_id?: string;
    transaction_id?: string;
  } | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        setLoading(true);
        
        // Buscar o pedido
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", params.id)
          .single();
          
        if (orderError) {
          console.error("Erro ao buscar pedido:", orderError);
          toast.error("Erro ao carregar informações do pedido");
          return;
        }
        
        setOrder(orderData);
        
        // Verificar status do pagamento
        let statusData;
        if (orderData.payment_method === "pix" && orderData.pix_transaction_id) {
          statusData = await abacatepay.checkPixStatus(orderData.pix_transaction_id);
        } else if (orderData.abacatepay_billing_id) {
          statusData = await abacatepay.checkBillingStatus(orderData.abacatepay_billing_id);
        } else {
          throw new Error("Informações de pagamento não encontradas");
        }
        
        // Atualizar o status do pedido se necessário
        if (statusData.status === "PAID" || statusData.status === "COMPLETED") {
          if (orderData.payment_status !== "completed") {
            await supabase
              .from("orders")
              .update({
                payment_status: "completed",
                status: "processing",
                updated_at: new Date().toISOString()
              })
              .eq("id", orderData.id);
          }
        }
        
        setPaymentData({
          status: statusData.status,
          payment_method: orderData.payment_method,
          amount: orderData.total_amount,
          created_at: orderData.created_at,
          billing_id: orderData.abacatepay_billing_id,
          transaction_id: orderData.pix_transaction_id
        });
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
        toast.error("Erro ao verificar status do pagamento");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(fetchPaymentStatus, 30000);
    
    return () => clearInterval(interval);
  }, [params.id]);

  const handleRefreshStatus = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
      // Verificar status do pagamento
      let statusData;
      if (order.payment_method === "pix" && order.pix_transaction_id) {
        statusData = await abacatepay.checkPixStatus(order.pix_transaction_id);
      } else if (order.abacatepay_billing_id) {
        statusData = await abacatepay.checkBillingStatus(order.abacatepay_billing_id);
      } else {
        throw new Error("Informações de pagamento não encontradas");
      }
      
      // Atualizar o status do pedido se necessário
      if (statusData.status === "PAID" || statusData.status === "COMPLETED") {
        if (order.payment_status !== "completed") {
          await supabase
            .from("orders")
            .update({
              payment_status: "completed",
              status: "processing",
              updated_at: new Date().toISOString()
            })
            .eq("id", order.id);
            
          // Atualizar o pedido local
          setOrder({
            ...order,
            payment_status: "completed",
            status: "processing"
          });
        }
      }
      
      setPaymentData({
        ...paymentData,
        status: statusData.status
      });
      
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar status do pagamento:", error);
      toast.error("Erro ao atualizar status do pagamento");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusInfo = () => {
    if (!paymentData) return { icon: Clock, color: "text-gray-500", text: "Desconhecido" };
    
    const status = paymentData.status;
    
    if (status === "PAID" || status === "COMPLETED") {
      return {
        icon: CheckCircle,
        color: "text-green-500",
        text: "Pagamento confirmado",
        description: "Seu pagamento foi confirmado e seu pedido está sendo processado."
      };
    } else if (status === "PENDING") {
      return {
        icon: Clock,
        color: "text-yellow-500",
        text: "Aguardando pagamento",
        description: paymentData.payment_method === "pix" 
          ? "Estamos aguardando a confirmação do seu pagamento PIX."
          : paymentData.payment_method === "boleto"
          ? "Estamos aguardando a confirmação do pagamento do boleto."
          : "Estamos aguardando a confirmação do seu pagamento."
      };
    } else if (status === "PROCESSING") {
      return {
        icon: Clock,
        color: "text-blue-500",
        text: "Processando pagamento",
        description: "Seu pagamento está sendo processado. Isso pode levar alguns instantes."
      };
    } else {
      return {
        icon: XCircle,
        color: "text-red-500",
        text: "Pagamento não realizado",
        description: "Houve um problema com seu pagamento. Por favor, tente novamente ou entre em contato com o suporte."
      };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-8">Verificando status do pagamento...</h1>
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <motion.button
          onClick={() => router.push("/orders")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Meus Pedidos
        </motion.button>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <StatusIcon className={`w-16 h-16 ${statusInfo.color} mb-4`} />
            <h1 className="text-2xl font-bold">{statusInfo.text}</h1>
            <p className="text-gray-600 mt-2">{statusInfo.description}</p>
          </div>
          
          {order && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Detalhes do Pedido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Número do Pedido</p>
                  <p className="font-medium">#{order.id}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Método de Pagamento</p>
                  <p className="font-medium capitalize">
                    {order.payment_method === "pix" ? "PIX" : 
                     order.payment_method === "credit_card" ? "Cartão de Crédito" : 
                     order.payment_method === "boleto" ? "Boleto Bancário" : 
                     order.payment_method}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Atualizando..." : "Atualizar Status"}
            </button>
            
            <button
              onClick={() => router.push(order ? `/orders/${order.id}` : "/orders")}
              className="flex-1 py-3 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Ver Detalhes do Pedido
            </button>
          </div>
          
          {paymentData?.payment_method === "boleto" && paymentData?.billing_id && (
            <div className="mt-4">
              <a
                href={`/checkout/boleto/${paymentData.billing_id}`}
                className="text-primary hover:underline block text-center"
              >
                Visualizar Boleto
              </a>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mt-6 text-center">
            Em caso de dúvidas, entre em contato com nosso suporte pelo WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
