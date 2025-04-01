// src/app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import OrderSummary from "@/components/checkout/order-summary";
import PixQRCode from "@/components/checkout/pix-qr-code";
import BoletoForm from "@/components/checkout/boleto-form";
import { PaymentElement } from "@stripe/react-stripe-js";
import { useCheckout } from "@/hooks/useCheckout";
import { supabase } from "@/lib/supabase";
import { PaymentMethod } from "@/types";
import type { Database } from "@/types/supabase";
import AddressForm, { ShippingAddress } from "@/components/checkout/address-form";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);


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
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [boletoClientSecret, setBoletoClientSecret] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    pixCode: string;
    expiresAt: string;
    transactionId: string;
    qrCodeImage: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { completeCheckout, loading: checkoutLoading } = useCheckout();

  // Limpeza de cache ao sair
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setShippingAddress(null);
        setErrors({});
        setPixData(null);
        setCardClientSecret(null);
        setBoletoClientSecret(null);
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

    const orderData: Database["public"]["Tables"]["orders"]["Insert"] = {
      user_id: user.id,
      items: items,
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
    return order as unknown as Database["public"]["Tables"]["orders"]["Row"];
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

        case "credit_card":
          const { order: completedOrder } = await completeCheckout(shippingAddress, paymentMethod);
          await supabase
            .from("orders")
            .update({
              payment_status: "pending",
            })
            .eq("id", completedOrder.id);
          router.push(`/checkout/pending?order_id=${completedOrder.id}`);
          break;
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pedido");
    }
  };

  const startPixStatusCheck = (orderId: string, transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiRequest("GET", `/api/payment/pix/status/${transactionId}`);
        if (!response.ok) throw new Error("Erro ao verificar status do PIX");
        const { status } = await response.json();

        if (status === "PAID") {
          clearInterval(interval);
          await supabase
            .from("orders")
            .update({ payment_status: "paid", status: "processing" })
            .eq("id", orderId);
          toast.success("Pagamento PIX confirmado!");
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

        const amountInCents = Math.round(amount);
        const [secretsResponse, pixResponse] = await Promise.all([
          apiRequest("POST", "/api/payment", {
            amount: amountInCents,
            type: "secret",
          }),
          apiRequest("POST", "/api/payment", {
            amount: amountInCents,
            type: "pix",
          }),
        ]);

        if (!secretsResponse.ok || !pixResponse.ok) {
          throw new Error("Erro ao buscar dados de pagamento");
        }

        const [secretsData, pixData] = await Promise.all([
          secretsResponse.json(),
          pixResponse.json(),
        ]);

        setCardClientSecret(secretsData.card_client_secret || null);
        setBoletoClientSecret(secretsData.boleto_client_secret || null);
        setPixData({
          pixCode: pixData.pixCode,
          expiresAt: pixData.expiresAt,
          transactionId: pixData.transactionId,
          qrCodeImage: pixData.qrCodeImage,
        });
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
          onClick={() => router.push("/checkout")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Carrinho
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

            {paymentMethod === "boleto" && boletoClientSecret && (
              <div className="mt-6">
                <BoletoForm
                  clientSecret={boletoClientSecret}
                  onSuccess={() => {
                    router.push("/success");
                  }}
                />
              </div>
            )}

            {paymentMethod === "credit_card" && cardClientSecret && (
              <div className="mt-6">
                <Elements stripe={stripePromise} options={{ clientSecret: cardClientSecret }}>
                  <PaymentElement />
                </Elements>
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