"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, QrCode, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentMethod = "credit" | "pix" | "boleto";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [loading, setLoading] = useState(false);
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [creditCardData, setCreditCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });

  const [stripeError, setStripeError] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (paymentMethod === "credit" && !clientSecret) {
      initializePayment();
    }
  }, [paymentMethod]);

  const initializePayment = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication session found");
      }

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          items,
          total 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Failed to initialize payment");
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStripeError("");

    if (!stripe || !elements || !clientSecret) {
      setStripeError("Payment system not initialized");
      setLoading(false);
      return;
    }

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (stripeError) {
        throw stripeError;
      }

      clearCart();
    } catch (error) {
      console.error("Payment error:", error);
      setStripeError(error.message);
      toast.error("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePixCode = () => {
    // Simulate PIX code generation
    return "00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426655440000";
  };

  const generateBoletoCode = () => {
    // Simulate boleto code generation
    return "34191.79001 01043.510047 91020.150008 6 88770000002000";
  };

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Carrinho
        </motion.button>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">Método de Pagamento</h2>
              
              <div className="flex gap-4 mb-8">
                <motion.button
                  onClick={() => setPaymentMethod("credit")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                    paymentMethod === "credit" 
                      ? "border-primary bg-primary/5" 
                      : "border-input hover:border-primary"
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Cartão de Crédito</span>
                </motion.button>

                <motion.button
                  onClick={() => setPaymentMethod("pix")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                    paymentMethod === "pix" 
                      ? "border-primary bg-primary/5" 
                      : "border-input hover:border-primary"
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span>PIX</span>
                </motion.button>

                <motion.button
                  onClick={() => setPaymentMethod("boleto")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                    paymentMethod === "boleto" 
                      ? "border-primary bg-primary/5" 
                      : "border-input hover:border-primary"
                  }`}
                >
                  <Receipt className="w-6 h-6" />
                  <span>Boleto</span>
                </motion.button>
              </div>

              {paymentMethod === "credit" && (
                <div className="space-y-4">
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <form onSubmit={handlePayment} className="space-y-4">
                        <PaymentElement />
                        {stripeError && (
                          <p className="text-sm text-destructive">{stripeError}</p>
                        )}
                        <motion.button
                          type="submit"
                          disabled={loading || !stripe || !elements}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium mt-6 disabled:opacity-50"
                        >
                          {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-r-transparent mx-auto" />
                          ) : (
                            `Pagar R$ ${total.toFixed(2)}`
                          )}
                        </motion.button>
                      </form>
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "pix" && (
                <div className="flex flex-col items-center gap-6">
                  <QRCodeCanvas 
                    value={generatePixCode()}
                    size={200}
                    level="H"
                    className="bg-white p-4 rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Escaneie o código QR com seu aplicativo de pagamento<br />
                    ou copie o código PIX abaixo
                  </p>
                  <div className="w-full">
                    <div className="bg-secondary p-3 rounded-lg text-sm font-mono break-all">
                      {generatePixCode()}
                    </div>
                    <motion.button
                      onClick={() => navigator.clipboard.writeText(generatePixCode())}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium mt-2"
                    >
                      Copiar Código
                    </motion.button>
                  </div>
                </div>
              )}

              {paymentMethod === "boleto" && (
                <div className="space-y-6">
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Código do Boleto:
                    </p>
                    <p className="font-mono break-all">{generateBoletoCode()}</p>
                  </div>
                  <div className="space-y-2">
                    <motion.button
                      onClick={() => navigator.clipboard.writeText(generateBoletoCode())}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
                    >
                      Copiar Código
                    </motion.button>
                    <motion.button
                      onClick={() => window.print()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium"
                    >
                      Imprimir Boleto
                    </motion.button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    O boleto vence em 3 dias úteis.<br />
                    Após o pagamento, pode levar até 3 dias úteis para a confirmação.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
