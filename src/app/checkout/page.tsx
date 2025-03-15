"use client";

import { useState, useEffect } from "react";
import { useStripe, useElements, Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import AddressForm from "@/components/checkout/address-form";
import OrderSummary from "@/components/checkout/order-summary";
import PixQRCode from "@/components/checkout/pix-qr-code";
import { convertToStripeAddress } from "../shared/schema";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

// Initialize Stripe with the publishable key
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Stripe key: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

type PaymentMethod = "card" | "pix";

interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

const PaymentMethods = ({ paymentMethod, setPaymentMethod }: { paymentMethod: PaymentMethod; setPaymentMethod: (method: PaymentMethod) => void }) => {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Método de Pagamento</h2>
      <div className="flex gap-4">
        <button
          onClick={() => setPaymentMethod("card")}
          className={`px-4 py-2 rounded ${paymentMethod === "card" ? "bg-primary text-white" : "bg-gray-200"}`}
        >
          Cartão de Crédito
        </button>
        <button
          onClick={() => setPaymentMethod("pix")}
          className={`px-4 py-2 rounded ${paymentMethod === "pix" ? "bg-primary text-white" : "bg-gray-200"}`}
        >
          PIX
        </button>
      </div>
    </div>
  );
};

const CheckoutForm = ({ paymentMethod, items, total, clearCart, shippingAddress }: {
  paymentMethod: PaymentMethod;
  items: any[];
  total: number;
  clearCart: () => void;
  shippingAddress: ShippingAddress;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const createCheckoutSession = async () => {
    setLoading(true);
    setIsProcessing(true);

    try {
      if (!stripe || !elements) return;

      // Confirme o pagamento usando o clientSecret
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        clearCart();
        router.push("/checkout/success");
      }
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      toast.error("Erro ao criar sessão de checkout");
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-8">
      {paymentMethod === "pix" && <PixQRCode pixCode={""} amount={0} expiresAt={""} />}
      {paymentMethod === "card" && <PaymentElement />}
      <button
        onClick={createCheckoutSession}
        disabled={loading || isProcessing}
        className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline"
      >
        {loading ? "Processando..." : "Finalizar Compra"}
      </button>
    </div>
  );
};

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const { items, total, clearCart } = useCart();
  const router = useRouter();
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Busque o clientSecret ao carregar a página
  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch("/api/secret", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao obter clientSecret");
        }

        const { client_secret } = await response.json();
        setClientSecret(client_secret);
      } catch (error) {
        console.error("Erro ao buscar clientSecret:", error);
        toast.error("Erro ao iniciar o pagamento");
      }
    };

    fetchClientSecret();
  }, []);

  if (!clientSecret) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => router.back()}
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
        <div className="mt-8">
          <PaymentMethods paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              paymentMethod={paymentMethod}
              items={items}
              total={total}
              clearCart={clearCart}
              shippingAddress={shippingAddress}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}