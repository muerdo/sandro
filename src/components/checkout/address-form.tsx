"use client";

import React, { useEffect, useState } from "react";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";
import { useShippingAddress } from "@/hooks/useShippingAddress";
import { supabase } from "@/lib/supabase";

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
      console.log("Endereço carregado do Supabase:", shippingAddress);

      // Manter os dados do formulário se já foram preenchidos pelo usuário
      // Apenas preencher campos vazios com dados do Supabase
      setFormData(prevData => ({
        id: prevData.id || shippingAddress.id || "",
        user_id: prevData.user_id || shippingAddress.user_id || "",
        full_name: prevData.full_name || shippingAddress.full_name || "",
        email: prevData.email || shippingAddress.email || "",
        phone: prevData.phone || shippingAddress.phone || "",
        address: prevData.address || shippingAddress.address || "",
        city: prevData.city || shippingAddress.city || "",
        state: prevData.state || shippingAddress.state || "",
        postal_code: prevData.postal_code || shippingAddress.postal_code || "",
        is_default: prevData.is_default || shippingAddress.is_default || false,
        created_at: prevData.created_at || shippingAddress.created_at || null,
        updated_at: prevData.updated_at || shippingAddress.updated_at || null,
      }));

      // Limpa os erros para os campos preenchidos
      const updatedErrors = { ...errors };
      if (shippingAddress.full_name) updatedErrors.full_name = "";
      if (shippingAddress.email) updatedErrors.email = "";
      if (shippingAddress.phone) updatedErrors.phone = "";
      if (shippingAddress.address) updatedErrors.address = "";
      if (shippingAddress.city) updatedErrors.city = "";
      if (shippingAddress.state) updatedErrors.state = "";
      if (shippingAddress.postal_code) updatedErrors.postal_code = "";
      setErrors(updatedErrors);
    }
  }, [shippingAddress, setErrors, errors]);

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

    // Só valida se o campo estiver preenchido (não vazio) mas não tiver 10 ou 11 dígitos
    if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
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
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para salvar o endereço");
        return;
      }

      // Preparar dados do endereço
      const addressData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        is_default: true
      };

      // Verificar se já existe um endereço padrão
      if (addressData.is_default) {
        // Atualizar outros endereços para não serem padrão
        const { error: updateError } = await supabase
          .from("shipping_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", formData.id || 'new-address');

        if (updateError) {
          console.error("Erro ao atualizar endereços existentes:", updateError);
          // Continuar mesmo com erro
        }
      }

      let updatedAddress;

      if (formData.id) {
        // Atualizar endereço existente
        const { data, error } = await supabase
          .from("shipping_addresses")
          .update(addressData)
          .eq("id", formData.id)
          .select()
          .single();

        if (error) throw error;
        updatedAddress = data;
      } else {
        // Criar novo endereço
        const newAddress = {
          ...addressData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          is_default: true // Primeiro endereço é sempre padrão
        };

        const { data, error } = await supabase
          .from("shipping_addresses")
          .insert([newAddress])
          .select()
          .single();

        if (error) throw error;
        updatedAddress = data;
      }

      if (updatedAddress) {
        // Atualizar o hook de endereço
        await updateShippingAddress(updatedAddress);

        // Atualizar estados locais
        setFormData(updatedAddress);
        setShippingAddress(updatedAddress);

        toast.success("Endereço salvo com sucesso!");

        // Registrar no console para debug
        console.log("Endereço salvo no Supabase:", updatedAddress);
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

  // O telefone é formatado diretamente pelo IMaskInput via onAccept

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
    if (digits.length < 10 || digits.length > 11) return "Telefone inválido (DDD + 8 ou 9 dígitos)";
    return "";
  };

  const validatePostalCode = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    return !digits ? "CEP é obrigatório" : digits.length === 8 ? "" : "CEP inválido";
  };

  // Função de formatação de telefone não é necessária, pois o IMaskInput já faz isso

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
  name="phone"
  value={formData.phone}
  onAccept={(value) => {
    setFormData(prev => ({ ...prev, phone: value }));
    validateField("phone", value);
  }}
  placeholder="+55 (00) 00000-0000"
  className="w-full p-2 border rounded"
  disabled={shippingLoading}
/>
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