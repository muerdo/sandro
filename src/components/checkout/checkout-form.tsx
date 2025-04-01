"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart, CartItem } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import type { Database } from "@/types/supabase";
import PixPayment from "./pix-qr-code";
import BoletoForm from "./boleto-form";

// Alinhado com shipping_addresses do Supabase
interface ShippingAddress {
  full_name: string; // Obrigatório
  email: string; // Obrigatório
  address: string; // Obrigatório
  city: string; // Obrigatório
  state: string; // Obrigatório
  zip_code: string; // Obrigatório (mapeado de postal_code)
}

export default function Checkout({
  paymentMethod,
  clientSecret,
}: {
  paymentMethod: "credit_card" | "pix" | "boleto";
  clientSecret?: string;
}) {
  const supabase = createClientComponentClient<Database>();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items,  total } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  // Busca o endereço de entrega do usuário
  const fetchShippingAddress = async () => {
    if (!user) return;

    try {
      // Tenta buscar o endereço padrão de shipping_addresses
      const { data: addressData, error: addressError } = await supabase
        .from("shipping_addresses")
        .select("full_name, email, address, city, state, postal_code")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle() as { data: Database["public"]["Tables"]["shipping_addresses"]["Row"] | null; error: any };

      if (addressError) throw addressError;

      if (addressData) {
        setShippingAddress({
          full_name: addressData.full_name,
          email: addressData.email,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          zip_code: addressData.postal_code,
        });
        return;
      }

      // Fallback para o primeiro endereço disponível
      const { data: fallbackAddress, error: fallbackError } = await supabase
        .from("shipping_addresses")
        .select("full_name, email, address, city, state, postal_code")
        .eq("user_id", user.id)
        .maybeSingle() as { data: Database["public"]["Tables"]["shipping_addresses"]["Row"] | null; error: any };

      if (fallbackError) throw fallbackError;

      if (fallbackAddress) {
        setShippingAddress({
          full_name: fallbackAddress.full_name,
          email: fallbackAddress.email,
          address: fallbackAddress.address,
          city: fallbackAddress.city,
          state: fallbackAddress.state,
          zip_code: fallbackAddress.postal_code,
        });
        return;
      }

      // Fallback para profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single() as { data: Database["public"]["Tables"]["profiles"]["Row"]; error: any };

      if (profileError) throw profileError;

      if (profileData) {
        setShippingAddress({
          full_name: profileData.full_name || "",
          email: profileData.email || user.email || "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      toast.error("Não foi possível carregar o endereço de entrega");
    }
  };

  useEffect(() => {
    if (user) {
      fetchShippingAddress();
    }
  }, [user]);

  const createOrder = async () => {
    if (!user) throw new Error("Usuário não autenticado");

    const orderData: Database["public"]["Tables"]["orders"]["Insert"] = {
      user_id: user.id,
      items: items, // CartItem[] é serializado como Json
      total_amount: total,
      shipping_address: {
        full_name: shippingAddress.full_name,
        email: shippingAddress.email,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip_code: shippingAddress.zip_code,
      },
      payment_method: paymentMethod,
      payment_status: "pending",
      status: "processing",
    };

    const { data: order, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single() as { data: Database["public"]["Tables"]["orders"]["Row"]; error: any };

    if (error) throw error;
    return order;
  };

  const handleCreditCardPayment = async (orderId: string) => {
    if (!stripe || !elements) {
      throw new Error("Stripe não inicializado corretamente");
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        receipt_email: shippingAddress.email,
      },
    });

    if (error) throw error;
  };

  const handlePixPayment = async (orderId: string) => {
    const response = await fetch("/api/pix/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        amount: total,
        customer: {
          name: shippingAddress.full_name,
          email: shippingAddress.email,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao gerar PIX");
    }

    return response.json();
  };

  const processPayment = async (orderId: string) => {
    switch (paymentMethod) {
      case "credit_card":
        await handleCreditCardPayment(orderId);
        break;
      case "pix":
        const pixData = await handlePixPayment(orderId);
        await supabase
          .from("orders")
          .update({ payment_status: pixData })
          .eq("id", orderId);
        router.push(`/checkout/success?order_id=${orderId}`);
        break;
      case "boleto":
        break;
      default:
        throw new Error("Método de pagamento não suportado");
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!user) return router.push("/login");

    if (
      !shippingAddress.full_name ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zip_code
    ) {
      return toast.error("Por favor, preencha todos os campos do endereço de entrega");
    }

    setIsLoading(true);

    try {
      const order = await createOrder();
      if (paymentMethod !== "boleto") {
        await processPayment(order.id);
      }
      if (paymentMethod !== "boleto") {
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethod = () => {
    switch (paymentMethod) {
      case "credit_card":
        return <PaymentElement options={{ layout: "tabs" }} />;
      case "pix":
        return <PixPayment amount={total} pixCode={""} expiresAt={""} />;
      case "boleto":
        return (
          <BoletoForm
            clientSecret={clientSecret!}
            onSuccess={() => {
              router.push("/checkout/success");
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="checkout-container max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Endereço de Entrega</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome Completo</label>
              <input
                type="text"
                value={shippingAddress.full_name}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, full_name: e.target.value })
                }
                className="w-full bg-background px-3 py-2 rounded-lg border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={shippingAddress.email}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, email: e.target.value })
                }
                className="w-full bg-background px-3 py-2 rounded-lg border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, address: e.target.value })
                }
                className="w-full bg-background px-3 py-2 rounded-lg border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, city: e.target.value })
                }
                className="w-full bg-background px-3 py-2 rounded-lg border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <input
                type="text"
                value={shippingAddress.state}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, state: e.target.value })
                }
                className="w-full bg-background px-3 py-2 rounded-lg border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CEP</label>
              <input
                type="text"
                value={shippingAddress.zip_code}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, zip_code: e.target.value })
                }
                className="w-full bg-background px-3 py-2 rounded-lg border"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Pagamento</h2>
          {renderPaymentMethod()}
        </div>

        {paymentMethod !== "boleto" && (
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isLoading || !stripe
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {isLoading ? "Processando..." : "Finalizar Compra"}
          </button>
        )}
      </form>

      <div className="mt-6 text-sm text-gray-600">
        {paymentMethod === "credit_card" && (
          <p>Use 4242 4242 4242 4242 para testes com cartão de crédito</p>
        )}
        {paymentMethod === "pix" && (
          <p>O QR Code será gerado após a confirmação do pedido</p>
        )}
      </div>
    </div>
  );
}