"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, QrCode, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import OrderSummary from "@/components/checkout/order-summary";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";


type PaymentMethod = "credit" | "pix" | "boleto";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [loading, setLoading] = useState(false);
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [shippingAddress, setShippingAddress] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: ""
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedAddresses();
    }
  }, [user]);

  const loadSavedAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      if (data?.[0]) {
        setSelectedAddress(data[0].id);
        setShippingAddress(data[0]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    }
  };

  const saveAddress = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to save your address');
        return;
      }

      const { error } = await supabase
        .from('shipping_addresses')
        .insert({
          ...shippingAddress,
          user_id: user.id
        });

      if (error) throw error;
      toast.success('Address saved successfully');
      loadSavedAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const isFreeShipping = shippingAddress.city.toLowerCase() === 'açailândia' && 
                        shippingAddress.state.toLowerCase() === 'maranhão';

  const [isProcessing, setIsProcessing] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No authentication session found");
      }

      const response = await fetch('https://tgtxeiaisnyqjlebgcgn.supabase.co/functions/v1/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: 'brl',
          payment_method_types: ['card'],
          metadata: {
            order_id: crypto.randomUUID(),
            customer_id: user?.id,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      if (!data.clientSecret) {
        throw new Error('No client secret received');
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Failed to initialize payment");
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to complete your purchase');
      return;
    }

    if (!selectedAddress && !showNewAddressForm) {
      toast.error('Please select or add a shipping address');
      return;
    }

    setLoading(true);
    setStripeError("");
    setIsProcessing(true);

    try {
      // Create order first
      const orderId = crypto.randomUUID();
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          user_id: user.id,
          items: items,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: 'pending',
          status: 'pending',
          shipping_address: shippingAddress
        });

      if (orderError) {
        throw new Error('Failed to create order');
      }

      if (paymentMethod === 'credit') {
        if (!stripe || !elements || !clientSecret) {
          throw new Error("Payment system not initialized");
        }

        const result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success`,
            payment_method_data: {
              billing_details: {
                name: shippingAddress.full_name,
                email: shippingAddress.email,
                phone: shippingAddress.phone,
                address: {
                  line1: shippingAddress.address,
                  city: shippingAddress.city,
                  state: shippingAddress.state,
                  postal_code: shippingAddress.postal_code,
                  country: 'BR'
                }
              }
            },
            metadata: {
              order_id: orderId,
              customer_name: shippingAddress.full_name,
              shipping_address: JSON.stringify(shippingAddress)
            }
          }
        });

        if (result.error) {
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'failed',
              status: 'cancelled'
            })
            .eq('id', orderId);

          throw result.error;
        }

      } else if (paymentMethod === 'pix') {
        const { data: pixData, error: pixError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: Math.round(total * 100),
            currency: 'brl',
            payment_method_types: ['pix'],
            metadata: {
              order_id: orderId,
              customer_name: shippingAddress.full_name,
              shipping_address: JSON.stringify(shippingAddress)
            }
          }
        });

        if (pixError) throw pixError;

        // Store PIX info in localStorage for later verification
        if (typeof window !== 'undefined') {
          localStorage.setItem('pix_payment_info', JSON.stringify({
            order_id: orderId,
            payment_intent_id: pixData.id,
            amount: total,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
          }));
        }

        // Show PIX QR code and copy button
        setPixCode(pixData.qr_code);
        toast.success('PIX QR Code generated successfully');

      } else if (paymentMethod === 'boleto') {
        const { data: boletoData, error: boletoError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: Math.round(total * 100),
            currency: 'brl',
            payment_method_types: ['boleto'],
            metadata: {
              order_id: orderId,
              customer_name: shippingAddress.full_name,
              shipping_address: JSON.stringify(shippingAddress)
            }
          }
        });

        if (boletoError) throw boletoError;

        // Store boleto info
        if (typeof window !== 'undefined') {
          localStorage.setItem('boleto_payment_info', JSON.stringify({
            order_id: orderId,
            payment_intent_id: boletoData.id,
            amount: total,
            expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
          }));
        }

        setBoletoUrl(boletoData.boleto_url);
        toast.success('Boleto generated successfully');
      }

      clearCart();
      router.push('/checkout/success');

    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setStripeError(errorMessage);
      toast.error("Payment failed: " + errorMessage);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const [pixCode, setPixCode] = useState<string>('');
  const [boletoUrl, setBoletoUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  // Check payment status periodically for PIX and Boleto
  useEffect(() => {
    if (paymentMethod !== 'credit' && (pixCode || boletoUrl)) {
      const interval = setInterval(async () => {
        try {
          const paymentInfo = paymentMethod === 'pix' 
            ? JSON.parse(localStorage.getItem('pix_payment_info') || '{}')
            : JSON.parse(localStorage.getItem('boleto_payment_info') || '{}');

          if (!paymentInfo.payment_intent_id) return;

          const { data, error } = await supabase.functions.invoke('check-payment-status', {
            body: { payment_intent_id: paymentInfo.payment_intent_id }
          });

          if (error) throw error;

          if (data.status === 'succeeded') {
            clearInterval(interval);
            setPaymentStatus('completed');
            router.push('/checkout/success');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [paymentMethod, pixCode, boletoUrl]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Please Sign In to Continue</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to complete your purchase</p>
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg"
          >
            Sign In
          </motion.button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Please Sign In to Continue</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to complete your purchase</p>
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg"
          >
            Sign In
          </motion.button>
        </div>
      </div>
    );
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
          Back to Cart
        </motion.button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            <div className="col-span-2 space-y-8">
              {/* Shipping Information */}
              <div className="bg-card p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
                
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Saved Addresses</h3>
                    <div className="space-y-3">
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer ${
                            selectedAddress === address.id
                              ? 'border-primary bg-primary/5'
                              : 'border-input hover:border-primary'
                          }`}
                          onClick={() => {
                            setSelectedAddress(address.id);
                            setShippingAddress(address);
                            setShowNewAddressForm(false);
                          }}
                        >
                          <p className="font-medium">{address.full_name}</p>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium mb-6"
                >
                  {showNewAddressForm ? 'Cancel New Address' : 'Add New Address'}
                </motion.button>

                {showNewAddressForm && (
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.full_name}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                          className="w-full p-2 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={shippingAddress.email}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                          className="w-full p-2 rounded-lg border bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full p-2 rounded-lg border bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        className="w-full p-2 rounded-lg border bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="w-full p-2 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="w-full p-2 rounded-lg border bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                        className="w-full p-2 rounded-lg border bg-background"
                      />
                    </div>
                    <motion.button
                      type="button"
                      onClick={saveAddress}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
                    >
                      Save Address
                    </motion.button>
                  </form>
                )}

                {isFreeShipping && (
                  <div className="mt-4 p-4 bg-green-500/10 text-green-500 rounded-lg">
                    Free shipping available for Açailândia, Maranhão!
                  </div>
                )}

                <p className="mt-4 text-sm text-muted-foreground">
                  Order confirmation and shipping updates will be sent to your email address.
                </p>
              </div>

              {/* Payment Method Section */}
              <div className="bg-card p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-6">Payment Method</h2>
              
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
                    <form onSubmit={handlePayment} className="space-y-4">
                      <PaymentElement 
                        options={{
                          layout: "tabs",
                          paymentMethodOrder: ['card'],
                          defaultValues: {
                            billingDetails: {
                              name: shippingAddress.full_name,
                              email: shippingAddress.email,
                              phone: shippingAddress.phone,
                              address: {
                                country: 'BR',
                                postal_code: shippingAddress.postal_code,
                                state: shippingAddress.state,
                                city: shippingAddress.city,
                                line1: shippingAddress.address
                              }
                            }
                          }
                        }}
                      />
                      {stripeError && (
                        <p className="text-sm text-destructive">{stripeError}</p>
                      )}
                      <motion.button
                        type="submit"
                        disabled={isProcessing || !stripe || !elements}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium mt-6 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-r-transparent" />
                            <span>Processando...</span>
                          </div>
                        ) : (
                          `Pagar R$ ${total.toFixed(2)}`
                        )}
                      </motion.button>
                    </form>
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
              <OrderSummary items={items} total={total} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
