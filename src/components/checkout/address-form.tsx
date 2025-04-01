"use client";

import React, { useEffect, useState } from "react";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";
import { useShippingAddress } from "@/hooks/useShippingAddress";

// Tipo ShippingAddress exportado diretamente aqui
export interface ShippingAddress {
  id?: string; // Opcional, pois pode não existir em um novo endereço
  user_id?: string; // Opcional, preenchido pelo hook ou backend
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean; // Opcional, padrão false
  created_at?: string | null; // Opcional, gerado pelo backend
  updated_at?: string | null; // Opcional, gerado pelo backend
}

interface AddressFormProps {
  shippingAddress?: Partial<ShippingAddress>; // Pode ser parcial ou undefined
  setShippingAddress: (address: ShippingAddress | null) => void; // Permite null para compatibilidade com Checkout
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

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

const AddressForm: React.FC<AddressFormProps> = ({
  shippingAddress: initialShippingAddress = {},
  setShippingAddress,
  errors,
  setErrors,
}) => {
  const { shippingAddress, loading: shippingLoading, error: shippingError, updateShippingAddress } = useShippingAddress();
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado local para o formulário
  const [formData, setFormData] = useState<ShippingAddress>({
    id: initialShippingAddress.id || "",
    user_id: "",
    full_name: initialShippingAddress.full_name || "",
    email: initialShippingAddress.email || "",
    phone: initialShippingAddress.phone || "",
    address: initialShippingAddress.address || "",
    city: initialShippingAddress.city || "",
    state: initialShippingAddress.state || "",
    postal_code: initialShippingAddress.postal_code || "",
    is_default: initialShippingAddress.is_default || false,
    created_at: initialShippingAddress.created_at || null,
    updated_at: initialShippingAddress.updated_at || null,
  });

  // Atualiza o estado pai sempre que o formData mudar
  useEffect(() => {
    setShippingAddress(formData);
  }, [formData, setShippingAddress]);

  // Carrega o endereço inicial do hook useShippingAddress, se disponível
  useEffect(() => {
    if (shippingAddress) {
      setFormData({
        id: shippingAddress.id || "",
        user_id: shippingAddress.user_id || "",
        full_name: shippingAddress.full_name || "",
        email: shippingAddress.email || "",
        phone: shippingAddress.phone || "",
        address: shippingAddress.address || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        postal_code: shippingAddress.postal_code || "",
        is_default: shippingAddress.is_default || false,
        created_at: shippingAddress.created_at || null,
        updated_at: shippingAddress.updated_at || null,
      });
    }
  }, [shippingAddress]);

  // Busca cidades quando o estado muda
  useEffect(() => {
    if (formData.state) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then((response) => response.json())
        .then((data) => {
          setCities(data.map((city: any) => city.nome));
        })
        .catch((error) => console.error("Erro ao buscar cidades:", error));
    } else {
      setCities([]);
    }
  }, [formData.state]);

  // Exibe erro do hook, se houver
  useEffect(() => {
    if (shippingError) {
      toast.error(shippingError);
    }
  }, [shippingError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) newErrors.full_name = "Nome completo é obrigatório";
    if (!formData.email.trim()) newErrors.email = "E-mail é obrigatório";
    if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
    if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
    if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!formData.state.trim()) newErrors.state = "Estado é obrigatório";
    if (!formData.postal_code.trim()) newErrors.postal_code = "CEP é obrigatório";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.phone = "Telefone inválido. Deve conter DDD + 8 ou 9 dígitos";
    }

    const cepDigits = formData.postal_code.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      newErrors.postal_code = "CEP inválido. Deve conter 8 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros antes de salvar");
      return;
    }

    setIsLoading(true);

    try {
      const addressData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
      };

      const updatedAddress = await updateShippingAddress(addressData);
      if (updatedAddress) {
        setFormData(updatedAddress); // Atualiza o estado local com o retorno
        setShippingAddress(updatedAddress); // Atualiza o estado pai
        toast.success("Endereço salvo com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar endereço");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddressByCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          postal_code: cep,
        }));

        const updatedErrors = { ...errors };
        if (data.logradouro) updatedErrors.address = "";
        if (data.localidade) updatedErrors.city = "";
        if (data.uf) updatedErrors.state = "";
        updatedErrors.postal_code = "";
        setErrors(updatedErrors);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handlePhoneChange = (value: string) => {
    const formattedValue = formatPhone(value);
    setFormData((prev) => ({ ...prev, phone: formattedValue }));
    validateField("phone", formattedValue);
  };

  const handleCEPChange = (value: string) => {
    const formattedValue = formatCEP(value);
    setFormData((prev) => ({ ...prev, postal_code: formattedValue }));
    validateField("postal_code", formattedValue);

    if (formattedValue.replace(/\D/g, "").length === 8) {
      fetchAddressByCEP(formattedValue);
    }
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        error = validatePhone(value);
        break;
      case "postal_code":
        error = validatePostalCode(value);
        break;
      default:
        if (!value.trim()) error = `${name} é obrigatório`;
    }
    setErrors({ ...errors, [name]: error });
  };

  const validateEmail = (value: string): string =>
    !value ? "E-mail é obrigatório" : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "E-mail inválido";

  const validatePhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return "Telefone é obrigatório";
    if (!digits.startsWith('55')) return "Deve incluir o código do Brasil (55)";
    if (digits.length !== 13) return "Telefone inválido (DDD + 9 dígitos)";
    return "";
  };

  const validatePostalCode = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    return !digits ? "CEP é obrigatório" : digits.length === 8 ? "" : "CEP inválido";
  };

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return `+55 ${digits}`;
    if (digits.length <= 6) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const formatCEP = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Nome Completo</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={isLoading || shippingLoading}
          />
          {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={isLoading || shippingLoading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>

      <div className="form-group">
  <label className="block text-sm font-medium mb-1">Telefone (WhatsApp)</label>
  <IMaskInput
    mask="+55 (00) 00000-0000"
    definitions={{
      '0': /[0-9]/
    }}
    name="phone"
    value={formData.phone}
    onAccept={(value) => {
      // Remove todos os caracteres não numéricos e formata
      const digits = value.replace(/\D/g, '');
      const formatted = digits.length > 0 ? `+${digits}` : '';
      setFormData(prev => ({ ...prev, phone: formatted }));
    }}
    placeholder="+55 (00) 00000-0000"
    className="w-full p-2 border rounded"
    disabled={shippingLoading}
  />
  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
</div>

      <div className="form-group">
        <label className="block text-sm font-medium mb-1">Endereço</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          disabled={isLoading || shippingLoading}
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled={isLoading || shippingLoading}
          >
            <option value="">Selecione</option>
            {estados.map((estado) => (
              <option key={estado.uf} value={estado.uf}>
                {estado.uf} - {estado.nome}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Cidade</label>
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!formData.state || isLoading || shippingLoading}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium mb-1">CEP</label>
          <IMaskInput
            mask="00000-000"
            name="postal_code"
            value={formData.postal_code}
            onAccept={handleCEPChange}
            placeholder="XXXXX-XXX"
            className="w-full p-2 border rounded"
            disabled={isLoading || shippingLoading}
          />
          {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>}
        </div>
      </div>

      <button
        onClick={handleSaveAddress}
        disabled={isLoading || shippingLoading}
        className={`mt-4 px-4 py-2 rounded-md ${
          isLoading || shippingLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary text-white hover:bg-primary-dark"
        }`}
      >
        {isLoading || shippingLoading ? "Salvando..." : "Salvar Endereço"}
      </button>
    </div>
  );
};

export default AddressForm;