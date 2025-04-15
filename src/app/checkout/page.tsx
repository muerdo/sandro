// src/app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import OrderSummary from "@/components/checkout/order-summary";
import PixQRCode from "@/components/checkout/pix-qr-code";
import BoletoForm from "@/components/checkout/boleto-form";
import { useAbacatePayCheckout } from "@/hooks/useAbacatePayCheckout";
import { supabase } from "@/lib/supabase";
import { PaymentMethod } from "@/types";
import type { Database } from "@/types/supabase";
// Importar apenas o tipo ShippingAddress
import type { ShippingAddress } from "@/components/checkout/address-form";
// Importar o componente AddressForm separadamente
import AddressForm from "@/components/checkout/address-form";
import abacatepay from "@/hooks/abacatepay";
import CreditCardForm from "@/components/checkout/credit-card-form";

// import { sendOrderNotification } from "@/lib/whatsapp-notification";


const PaymentMethods = ({
  paymentMethod,
  setPaymentMethod,
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}) => {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Método de Pagamento</h2>
      <div className="flex flex-wrap gap-4">
        {(["credit_card", "pix", "boleto"] as PaymentMethod[]).map((method) => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method)}
            className={`px-4 py-2 rounded ${
              paymentMethod === method ? "bg-primary text-white" : "bg-gray-200"
            }`}
          >
            {method === "credit_card" ? "Cartão de Crédito" : method.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const { items, total, } = useCart();
  const router = useRouter();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pixData, setPixData] = useState<{
    pixCode: string;
    expiresAt: string;
    transactionId: string;
    qrCodeImage: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { completeCheckout, loading: checkoutLoading, clearCart } = useAbacatePayCheckout();

  // Limpeza de cache ao sair
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setShippingAddress(null);
        setErrors({});
        setPixData(null);
        setLoading(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Carregar endereço e limpar cache inicial
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setShippingAddress(null);
          setLoading(false);
          return;
        }

        const { data: address } = await supabase
          .from("shipping_addresses")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .single();

        setShippingAddress(address || null);
      } catch (error) {
        console.error("Erro ao buscar endereço:", error);
        setShippingAddress(null);
      } finally {
        setLoading(false);
      }
    };

    setShippingAddress(null); // Limpa o cache inicial
    setErrors({});
    fetchDefaultAddress();
  }, []);

  const createOrder = async (): Promise<Database["public"]["Tables"]["orders"]["Row"]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    if (!shippingAddress) throw new Error("Endereço de entrega não fornecido");

    // Extrair notas dos itens do carrinho
    const itemsWithNotes = items.map(item => {
      // Verificar se há notas para este item
      if (item.notes) {
        return {
          ...item,
          notes: item.notes // Manter as notas do item
        };
      }
      return item;
    });

    const orderData: Database["public"]["Tables"]["orders"]["Insert"] = {
      user_id: user.id,
      items: itemsWithNotes, // Usar os itens com notas
      total_amount: total,
      shipping_address: JSON.parse(JSON.stringify(shippingAddress)),
      payment_method: paymentMethod,
      payment_status: "pending",
      status: "processing",
      transaction_id: null,
    };

    const { data: order, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;

    // Enviar notificação WhatsApp após criar o pedido
    try {
      const notifyResponse = await fetch('/api/whatsapp/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      if (notifyResponse.ok) {
        console.log("Notificação WhatsApp enviada para o pedido:", order.id);
      } else {
        const notifyError = await notifyResponse.json();
        console.error("Erro ao enviar notificação WhatsApp:", notifyError);
      }
    } catch (notifyError) {
      console.error("Erro ao enviar notificação WhatsApp:", notifyError);
      // Não interrompemos o fluxo principal se a notificação falhar
    }

    return order as unknown as Database["public"]["Tables"]["orders"]["Row"];
  };
  // Função para salvar checkout pendente com PIX
  const savePendingCheckout = async (pixTransactionId: string, pixCode: string, pixQrCode: string, pixExpiresAt: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      if (!shippingAddress) throw new Error("Endereço de entrega não fornecido");

      // Salvar o checkout pendente no Supabase
      // Usando uma solução temporária para contornar o problema de tipagem
      // @ts-ignore - A tabela pending_checkouts existe no banco de dados
      const { data, error } = await supabase
        .from('pending_checkouts')
        .insert({
          user_id: user.id,
          cart_items: JSON.stringify(items),
          shipping_address: JSON.stringify(shippingAddress),
          payment_method: paymentMethod,
          total_amount: total,
          pix_transaction_id: pixTransactionId,
          pix_code: pixCode,
          pix_qr_code: pixQrCode,
          pix_expires_at: pixExpiresAt,
          status: "pending",
          notes: `Checkout com PIX iniciado em ${new Date().toLocaleString()}`
        })
        .select();

      if (error) {
        console.error("Erro ao salvar checkout pendente:", error);
        // Não interromper o fluxo principal se falhar
      } else {
        console.log("Checkout pendente salvo com sucesso:", data);
      }
    } catch (error) {
      console.error("Erro ao salvar checkout pendente:", error);
      // Não interromper o fluxo principal se falhar
    }
  };

  const handleConfirmPayment = async () => {
    try {
      if (!shippingAddress) {
        toast.error("Por favor, informe um endereço de entrega válido");
        return;
      }

      const order = await createOrder();

      switch (paymentMethod) {
        case "pix":
          if (!pixData?.transactionId) {
            throw new Error("ID da transação PIX não encontrado");
          }

          // Salvar o checkout pendente antes de redirecionar
          if (pixData.pixCode && pixData.qrCodeImage && pixData.expiresAt) {
            await savePendingCheckout(
              pixData.transactionId,
              pixData.pixCode,
              pixData.qrCodeImage,
              pixData.expiresAt
            );
          }

          await supabase
            .from("orders")
            .update({
             id: pixData.transactionId,
            })
            .eq("id", order.id);
          startPixStatusCheck(order.id, pixData.transactionId);
          router.push(`/checkout/pending?order_id=${order.id}`);
          break;

        case "boleto":
          await supabase
            .from("orders")
            .update({
              payment_status: "pending",
            })
            .eq("id", order.id);
          router.push(`/checkout/pending?order_id=${order.id}`);
          break;

        case "credit_card": {
          // Usar AbacatePay para processar pagamento com cartão
          const { order: completedOrder, billing } = await completeCheckout(shippingAddress, paymentMethod);

          // Atualizar status do pedido
          await supabase
            .from("orders")
            .update({
              payment_status: "pending",
              abacatepay_billing_id: billing.id
            })
            .eq("id", completedOrder.id);

          // Redirecionar para página de pendente
          router.push(`/checkout/pending?order_id=${completedOrder.id}`);
          break;
        }
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pedido");
    }
  };

  const startPixStatusCheck = (orderId: string, transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        // Usar AbacatePay para verificar status do PIX
        const pixStatus = await abacatepay.checkPixStatus(transactionId);
        console.log("Status do PIX:", pixStatus);

        if (pixStatus.status === "PAID") {
          clearInterval(interval);

          // Atualizar o pedido para pago
          await supabase
            .from("orders")
            .update({ payment_status: "paid", status: "processing" })
            .eq("id", orderId);

          // Atualizar o checkout pendente para pago
          try {
            // @ts-ignore - A tabela pending_checkouts existe no banco de dados
            await supabase
              .from("pending_checkouts")
              .update({
                status: "paid",
                notes: `${new Date().toLocaleString()}: Pagamento PIX confirmado automaticamente.`,
                updated_at: new Date().toISOString()
              })
              .eq("pix_transaction_id", transactionId);
          } catch (pendingError) {
            console.error("Erro ao atualizar checkout pendente:", pendingError);
            // Não interromper o fluxo principal se falhar
          }

          // Enviar notificação de confirmação de pagamento
          try {
            await fetch('/api/whatsapp/notify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderId,
                status: 'paid'
              })
            });
          } catch (notificationError) {
            console.error("Erro ao enviar notificação de pagamento:", notificationError);
          }

          toast.success("Pagamento PIX confirmado!");
          clearCart(); // Limpa o carrinho apenas após confirmação de pagamento
          router.push("/success");
        }
      } catch (error) {
        console.error("Erro ao verificar status do PIX:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const amount = Number(total);
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Valor total do carrinho inválido");
        }

        // Gerar QR Code PIX usando AbacatePay
        console.log('Iniciando criação de QR Code PIX para valor:', amount);

        const pixResponse = await abacatepay.createPixQRCode({
          amount: amount,
          description: "Compra na Sandro Adesivos",
          expiresIn: 30 // minutos
        });

        console.log('Resposta do QR Code PIX recebida:', pixResponse);

        if (!pixResponse || !pixResponse.pixCode) {
          console.error('Resposta inválida do QR Code PIX:', pixResponse);
          toast.error('Erro ao gerar QR Code PIX. Tente novamente.');
          return;
        }

        setPixData({
          pixCode: pixResponse.pixCode,
          expiresAt: pixResponse.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          transactionId: pixResponse.transactionId,
          qrCodeImage: pixResponse.qrCodeImage
        });

        console.log('Dados do PIX definidos com sucesso:', pixResponse.pixCode);
      } catch (error) {
        console.error("Erro ao buscar dados de pagamento:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao carregar opções de pagamento");
        if (error instanceof Error && error.message.includes("Valor total")) {
          router.push("/checkout");
        }
      } finally {
        setLoading(false);
      }
    };

    if (total > 0) {
      fetchPaymentData();
    } else {
      toast.error("Seu carrinho está vazio");
      router.push("/checkout");
    }
  }, [total, router]);



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando opções de pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => router.push("/produtos")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para os Produtos
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Endereço de Entrega</h2>
            <AddressForm
              shippingAddress={shippingAddress || undefined}
              setShippingAddress={setShippingAddress}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="space-y-6">
            <OrderSummary items={items} total={total} />
            <PaymentMethods paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

            {paymentMethod === "pix" && pixData && (
              <div className="mt-6">
                <PixQRCode
                  pixCode={pixData.pixCode}
                  amount={total}
                  expiresAt={pixData.expiresAt}
                  transactionId={pixData.transactionId}
                  qrCodeImage={pixData.qrCodeImage}
                />
              </div>
            )}

            {paymentMethod === "boleto" && (
              <div className="mt-6">
                <BoletoForm
                  amount={total}
                  orderId={"order-" + Date.now()}
                  onSuccess={(billingId) => {
                    // Criar pedido e redirecionar
                    completeCheckout(shippingAddress, "boleto").then(({ order }) => {
                      // Atualizar pedido com ID da cobrança
                      supabase
                        .from("orders")
                        .update({
                          payment_status: "pending",
                          abacatepay_billing_id: billingId
                        })
                        .eq("id", order.id);

                      clearCart(); // Limpa o carrinho
                      router.push(`/checkout/pending?order_id=${order.id}`);
                    });
                  }}
                />
              </div>
            )}

            {paymentMethod === "credit_card" && (
              <div className="mt-6">
                <CreditCardForm
                  amount={total}
                  orderId={"order-" + Date.now()}
                  onSuccess={(paymentId) => {
                    // Criar pedido e redirecionar
                    completeCheckout(shippingAddress, "credit_card").then(({ order }) => {
                      // Atualizar pedido com ID da cobrança
                      supabase
                        .from("orders")
                        .update({
                          payment_status: "pending",
                          abacatepay_billing_id: paymentId
                        })
                        .eq("id", order.id);

                      clearCart(); // Limpa o carrinho
                      router.push(`/checkout/pending?order_id=${order.id}`);
                    });
                  }}
                />
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              disabled={!shippingAddress || checkoutLoading}
              className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium ${
                !shippingAddress || checkoutLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              }`}
            >
              {checkoutLoading ? "Processando..." : "Finalizar Pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
