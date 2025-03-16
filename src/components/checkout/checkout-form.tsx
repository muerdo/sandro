"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import BoletoForm from "@/components/checkout/boleto-form";
import { useCart } from "@/contexts/cart-context";
import PixQRCode from "./pix-qr-code";

const CheckoutForm = ({
  paymentMethod,
  items,
  total,
  clearCart,
  shippingAddress,
  clientSecret,
}: {
  paymentMethod: string;
  items: any[];
  total: number;
  clearCart: () => void;
  shippingAddress: any;
  clientSecret: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { cartTotal } = useCart(); // Use o contexto do carrinho para obter o valor total

  const handlePaymentSuccess = () => {
    clearCart();
    router.push("/checkout/success");
  };

  const handleCardPayment = async () => {
    setLoading(true);

    if (!stripe || !elements) {
      toast.error("Stripe não carregado corretamente.");
      return;
    }

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (result.error) {
        toast.error(result.error.message || "Erro ao processar o pagamento.");
      } else {
        handlePaymentSuccess();
      }
    } catch (error) {
      console.error("Erro ao confirmar pagamento com cartão:", error);
      toast.error("Erro ao processar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {paymentMethod === "pix" && <PixQRCode pixCode={""} amount={0} expiresAt={""} />}
      {paymentMethod === "card" && <PaymentElement />}
      {paymentMethod === "boleto" && (
        <BoletoForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
      )}

      {paymentMethod !== "boleto" && (
        <button
          onClick={handleCardPayment}
          disabled={loading}
          className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? "Processando..." : "Finalizar Compra"}
        </button>
      )}
    </div>
  );
};

export default CheckoutForm;