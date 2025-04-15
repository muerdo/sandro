"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Copy } from "lucide-react";
import { motion } from "framer-motion";
import abacatepay from "@/hooks/abacatepay";
import { supabase } from "@/lib/supabase";

export default function BoletoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [boletoData, setBoletoData] = useState<{
    barcode: string;
    pdf_url: string;
    due_date: string;
    amount: number;
    status: string;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoletoData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do boleto
        const billingId = params.id;
        
        // Buscar o pedido relacionado a este boleto
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id, status, payment_status")
          .eq("abacatepay_billing_id", billingId)
          .single();
          
        if (orderError) {
          console.error("Erro ao buscar pedido:", orderError);
          toast.error("Erro ao carregar informações do pedido");
        } else if (orderData) {
          setOrderId(orderData.id);
        }
        
        // Gerar boleto usando AbacatePay
        const boleto = await abacatepay.generateBoleto(billingId);
        
        setBoletoData({
          barcode: boleto.barcode,
          pdf_url: boleto.pdf_url,
          due_date: boleto.due_date,
          amount: boleto.amount,
          status: boleto.status
        });
      } catch (error) {
        console.error("Erro ao buscar dados do boleto:", error);
        toast.error("Erro ao carregar boleto. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoletoData();
  }, [params.id]);

  const handleCopyBarcode = () => {
    if (boletoData?.barcode) {
      navigator.clipboard.writeText(boletoData.barcode);
      toast.success("Código de barras copiado!");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-8">Carregando boleto...</h1>
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!boletoData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Boleto não encontrado</h1>
          <p className="text-gray-600 mb-8">
            Não foi possível encontrar o boleto solicitado. Verifique se o link está correto ou entre em contato com o suporte.
          </p>
          <button
            onClick={() => router.push("/checkout")}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Voltar para o checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </motion.button>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-6">Boleto Bancário</h1>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Valor:</span>
              <span className="font-semibold">{formatCurrency(boletoData.amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Vencimento:</span>
              <span className="font-semibold">{formatDate(boletoData.due_date)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${
                boletoData.status === 'PAID' ? 'text-green-600' : 
                boletoData.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {boletoData.status === 'PAID' ? 'Pago' : 
                 boletoData.status === 'PENDING' ? 'Pendente' : 'Expirado/Cancelado'}
              </span>
            </div>
            {orderId && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Pedido:</span>
                <span className="font-semibold">#{orderId}</span>
              </div>
            )}
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <h2 className="text-lg font-semibold mb-2">Código de Barras</h2>
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded flex-1 font-mono text-sm overflow-x-auto">
                {boletoData.barcode}
              </div>
              <button 
                onClick={handleCopyBarcode}
                className="ml-2 p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                title="Copiar código de barras"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <a
              href={boletoData.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              <Download className="w-5 h-5" />
              Baixar Boleto
            </a>
            
            <button
              onClick={() => router.push(orderId ? `/orders/${orderId}` : "/orders")}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Ver Pedido
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            O boleto pode levar até 3 dias úteis para ser compensado após o pagamento. 
            Você receberá uma confirmação por e-mail quando o pagamento for processado.
          </p>
        </div>
      </div>
    </div>
  );
}
