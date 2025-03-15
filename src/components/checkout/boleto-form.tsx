// src/components/checkout/boleto-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";

interface BoletoFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

// Lista de estados (UFs) do Brasil
const estados = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

export default function BoletoForm({ clientSecret, onSuccess }: BoletoFormProps) {
  const stripe = useStripe();
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Busca as cidades com base no estado selecionado
  useEffect(() => {
    if (state) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
        .then((response) => response.json())
        .then((data) => {
          const cityNames = data.map((city: any) => city.nome);
          setCities(cityNames);
        })
        .catch((error) => {
          console.error("Erro ao buscar cidades:", error);
          toast.error("Erro ao carregar cidades.");
        });
    } else {
      setCities([]);
    }
  }, [state]);

  // Função para validar CPF/CNPJ
  const validateTaxId = (value: string) => {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cpfRegex.test(value) && !cnpjRegex.test(value)) {
      return "CPF/CNPJ inválido. Use os formatos XXX.XXX.XXX-XX ou XX.XXX.XXX/XXXX-XX.";
    }
    return "";
  };

  // Função para validar CEP
  const validatePostalCode = (value: string) => {
    const cepRegex = /^\d{5}-\d{3}$/;
    if (!cepRegex.test(value)) {
      return "CEP inválido. Use o formato XXXXX-XXX.";
    }
    return "";
  };

  // Função para validar e-mail
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "E-mail inválido.";
    }
    return "";
  };

  // Função para validar todos os campos
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name) newErrors.name = "Nome é obrigatório.";
    if (!taxId) newErrors.taxId = "CPF/CNPJ é obrigatório.";
    else newErrors.taxId = validateTaxId(taxId);
    if (!email) newErrors.email = "E-mail é obrigatório.";
    else newErrors.email = validateEmail(email);
    if (!address) newErrors.address = "Endereço é obrigatório.";
    if (!city) newErrors.city = "Cidade é obrigatória.";
    if (!state) newErrors.state = "Estado é obrigatório.";
    if (!postalCode) newErrors.postalCode = "CEP é obrigatório.";
    else newErrors.postalCode = validatePostalCode(postalCode);

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error); // Retorna true se não houver erros
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    if (!stripe) {
      toast.error("Stripe não carregado corretamente.");
      return;
    }

    try {
      const result = await stripe.confirmBoletoPayment(clientSecret, {
        payment_method: {
          boleto: {
            tax_id: taxId.replace(/\D/g, ""), // Remove caracteres não numéricos
          },
          billing_details: {
            name,
            email,
            address: {
              line1: address,
              city,
              state,
              postal_code: postalCode.replace(/\D/g, ""), // Remove caracteres não numéricos
              country: "BR",
            },
          },
        },
      });

      if (result.error) {
        setErrors({ form: result.error.message || "Erro ao processar o boleto." });
        toast.error(result.error.message || "Erro ao processar o boleto.");
      } else {
        toast.success("Boleto gerado com sucesso!");
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao confirmar pagamento com boleto:", error);
      setErrors({ form: "Erro ao processar o boleto." });
      toast.error("Erro ao processar o boleto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
            CPF/CNPJ
          </label>
          <IMaskInput
            mask="000.000.000-00"
            value={taxId}
            onAccept={(value) => setTaxId(value)}
            placeholder="XXX.XXX.XXX-XX"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
          {errors.taxId && <p className="text-red-500 text-sm mt-1">{errors.taxId}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="form-group">
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            id="state"
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">Selecione um estado</option>
            {estados.map((estado) => (
              <option key={estado.uf} value={estado.uf}>
                {estado.nome}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Cidade
          </label>
          <select
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            disabled={!state}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="">Selecione uma cidade</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
            CEP
          </label>
          <IMaskInput
            mask="00000-000"
            value={postalCode}
            onAccept={(value) => setPostalCode(value)}
            placeholder="XXXXX-XXX"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
          {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
        </div>
      </div>

      {/* Exibe mensagens de erro gerais */}
      {errors.form && (
        <div id="error-message" className="text-red-500 text-sm mt-4">
          {errors.form}
        </div>
      )}

      <button
        id="submit-button"
        disabled={loading}
        className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        {loading ? "Processando..." : "Gerar Boleto"}
      </button>
    </form>
  );
}