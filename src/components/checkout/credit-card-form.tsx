"use client";

import { useState } from "react";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";
import abacatepay from "@/hooks/abacatepay";

interface CreditCardFormProps {
  onSuccess: (paymentId: string) => void;
  amount: number;
  orderId: string;
}

export default function CreditCardForm({ onSuccess, amount, orderId }: CreditCardFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\D/g, "").length !== 16) {
      newErrors.cardNumber = "Número de cartão inválido";
    }

    if (!formData.cardholderName) {
      newErrors.cardholderName = "Nome do titular é obrigatório";
    }

    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      newErrors.expiryDate = "Data de validade inválida";
    } else {
      const [month, year] = formData.expiryDate.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (
        parseInt(month) < 1 ||
        parseInt(month) > 12 ||
        parseInt(year) < currentYear ||
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        newErrors.expiryDate = "Data de validade inválida";
      }
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = "CVV inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Extrair mês e ano da data de validade
      const [month, year] = formData.expiryDate.split("/");
      
      // Criar objeto de dados do cartão
      const cardData = {
        card_number: formData.cardNumber.replace(/\D/g, ""),
        cardholder_name: formData.cardholderName,
        expiry_month: month,
        expiry_year: `20${year}`,
        cvv: formData.cvv,
        amount: amount,
        order_id: orderId,
        description: `Pedido #${orderId}`
      };

      // Processar pagamento com AbacatePay
      const response = await abacatepay.createBilling({
        amount: amount,
        payment_method: "card",
        order_id: orderId,
        card_details: cardData
      });

      toast.success("Pagamento processado com sucesso!");
      onSuccess(response.id);
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
      setErrors({ form: "Erro ao processar pagamento. Verifique os dados e tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Número do Cartão</label>
        <IMaskInput
          mask="0000 0000 0000 0000"
          name="cardNumber"
          value={formData.cardNumber}
          onAccept={(value) => setFormData((prev) => ({ ...prev, cardNumber: value }))}
          placeholder="1234 5678 9012 3456"
          className={`w-full p-2 border rounded-md ${
            errors.cardNumber ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nome no Cartão</label>
        <input
          type="text"
          name="cardholderName"
          value={formData.cardholderName}
          onChange={handleChange}
          placeholder="Nome como aparece no cartão"
          className={`w-full p-2 border rounded-md ${
            errors.cardholderName ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Validade</label>
          <IMaskInput
            mask="00/00"
            name="expiryDate"
            value={formData.expiryDate}
            onAccept={(value) => setFormData((prev) => ({ ...prev, expiryDate: value }))}
            placeholder="MM/AA"
            className={`w-full p-2 border rounded-md ${
              errors.expiryDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CVV</label>
          <IMaskInput
            mask="000"
            name="cvv"
            value={formData.cvv}
            onAccept={(value) => setFormData((prev) => ({ ...prev, cvv: value }))}
            placeholder="123"
            className={`w-full p-2 border rounded-md ${
              errors.cvv ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
        </div>
      </div>

      {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md text-white font-medium ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
        }`}
      >
        {loading ? "Processando..." : "Pagar com Cartão"}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        Seus dados de pagamento são processados com segurança pelo AbacatePay.
      </p>
    </form>
  );
}
