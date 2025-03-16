"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import AddressForm, { ShippingAddress } from "@/components/checkout/address-form";
import OrderSummary from "@/components/checkout/order-summary";
import PixQRCode from "@/components/checkout/pix-qr-code";
import BoletoForm from "@/components/checkout/boleto-form";
import { PaymentElement } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_live_51R1IrVBcKc0JVEeWwclXaS1aZVJSqs0cBuLLyP5UpibhRnZLtYgFykO5nihNeNk0wXbQWgyw2gOIB9adXeyFdpwx00cTbqUWMP");
type PaymentMethod = "card" | "pix" | "boleto";

const PaymentMethods = ({ 
  paymentMethod, 
  setPaymentMethod 
}: { 
  paymentMethod: PaymentMethod; 
  setPaymentMethod: (method: PaymentMethod) => void;
}) => {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Método de Pagamento</h2>
      <div className="flex flex-wrap gap-4">
        {["card", "pix", "boleto"].map((method) => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method as PaymentMethod)}
            className={`px-4 py-2 rounded ${
              paymentMethod === method ? "bg-primary text-white" : "bg-gray-200"
            }`}
          >
            {method === "card" ? "Cartão de Crédito" : method.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const { items, total, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    is_default: false,
  });

  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [boletoClientSecret, setBoletoClientSecret] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    pixCode: string;
    expiresAt: string;
    transactionId: string;
    qrCodeImage: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch payment data on load
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
    
        // Obter segredos do Stripe (cartão e boleto)
        const secretsResponse = await apiRequest("POST", "/api/payment", {
          amount: total,
          type: "secret", // Para segredos do Stripe
        });
        if (!secretsResponse.ok) {
          throw new Error("Erro ao buscar segredos de pagamento");
        }
        const secretsData = await secretsResponse.json();
        setCardClientSecret(secretsData.card_client_secret || null);
        setBoletoClientSecret(secretsData.boleto_client_secret || null);
    
        // Obter dados do PIX
        const pixResponse = await apiRequest("POST", "/api/payment", {
          amount: total,
          type: "pix", // Para gerar PIX
        });
        if (!pixResponse.ok) {
          throw new Error("Erro ao gerar código PIX");
        }
        const pixData = await pixResponse.json();
    
        setPixData({
          pixCode: pixData.pixCode,
          expiresAt: pixData.expiresAt,
          transactionId: pixData.transactionId,
          qrCodeImage: pixData.qrCodeImage,
        });
      } catch (error) {
        console.error("Erro ao buscar dados de pagamento:", error);
        toast.error(error.message || "Erro ao carregar opções de pagamento");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [total]);

  // Verificar status do PIX periodicamente
  useEffect(() => {
    if (paymentMethod === "pix" && pixData?.transactionId) {
      const interval = setInterval(async () => {
        try {
          const { status } = await apiRequest(
            "GET",
            `/api/payment/pix/status/${pixData.transactionId}`
          ).then(res => res.json());

          if (status === "PAID") {
            toast.success("Pagamento PIX confirmado!");
            clearCart();
            navigate("/success");
          }
        } catch (error) {
          console.error("Erro ao verificar status do PIX:", error);
        }
      }, 5000); // Verifica a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [paymentMethod, pixData, clearCart, navigate]);

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
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Carrinho
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AddressForm shippingAddress={shippingAddress} setShippingAddress={setShippingAddress} />
          <OrderSummary items={items} total={total} />
        </div>

        <PaymentMethods paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

        {paymentMethod === "pix" && pixData && (
          <PixQRCode 
            pixCode={pixData.pixCode}
            amount={total}
            expiresAt={pixData.expiresAt}
            transactionId={pixData.transactionId}
            qrCodeImage={pixData.qrCodeImage}
          />
        )}

        {paymentMethod === "boleto" && boletoClientSecret && (
          <BoletoForm clientSecret={boletoClientSecret} onSuccess={clearCart} />
        )}

        {paymentMethod === "card" && cardClientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret: cardClientSecret }}>
            <PaymentElement />
          </Elements>
        ) : paymentMethod === "card" ? (
          <p>Aguardando informações de pagamento...</p>
        ) : null}
      </div>
    </div>
  );
}
