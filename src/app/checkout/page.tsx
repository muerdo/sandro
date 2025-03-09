"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, QrCode, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const [paymentSettings, setPaymentSettings] = useState(null); // Estado para armazenar os dados bancários e PIX

  // Buscar os dados bancários e PIX do Supabase
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .single();

      if (data) {
        setPaymentSettings(data);
      }
    };

    fetchPaymentSettings();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular o CRC16
  const calculateCRC16 = (payload: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  // Gerar o payload do PIX dinâmico
  const generatePixPayload = (totalAmount: number) => {
    if (!paymentSettings) return "";
  
    const { beneficiary_name, beneficiary_city, psp_url } = paymentSettings;
  
    // Verifica se a URL do PSP está definida
    if (!psp_url) {
      console.error("URL do PSP não definida.");
      return "";
    }
  
    // Campos obrigatórios
    const payload = [
      "000201", // Payload Format Indicator
      "26580014BR.GOV.BCB.PIX", // Merchant Account Information (GUI)
      `0125${psp_url}`, // Merchant Account Information (URL)
      "52040000", // Merchant Category Code
      "5303986", // Transaction Currency (BRL)
      "5802BR", // Country Code (Brasil)
      `5913${beneficiary_name}`, // Merchant Name
      `6008${beneficiary_city}`, // Merchant City
      "62070503***", // Additional Data Field (Reference Label)
    ].join("");
  
    // Calcula o CRC16
    const crc16 = calculateCRC16(payload);
    return `${payload}6304${crc16}`;
  };

  // Gerar o código PIX com base nos dados do Supabase
  const generatePixCode = () => {
    if (!paymentSettings) return "";
    return generatePixPayload(total); // Gera o payload com o valor total da compra
  };

  // Gerar o código do boleto com base nos dados do Supabase
  const generateBoletoCode = () => {
    if (!paymentSettings) return "";
    return `Banco: ${paymentSettings.bank_name}\nAgência: ${paymentSettings.bank_agency}\nConta: ${paymentSettings.bank_account}\nBeneficiário: ${paymentSettings.beneficiary_name}`;
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
                <form onSubmit={handlePayment} className="space-y-4">
                  {/* Formulário do cartão de crédito */}
                </form>
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
                    Escaneie o código QR com seu aplicativo de pagamento
                    <br />
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
                  {/* Código do boleto */}
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