// hooks/useShippingAddress.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShippingAddress } from "@/types/admin";

export const useShippingAddress = () => {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Garante que o perfil existe antes de criar ou buscar o endereço
  const ensureProfileExists = async (userId: string, email: string) => {
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") { // PGRST116 = no rows found
      throw profileError;
    }

    if (!existingProfile) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          user_id: userId, // Se sua tabela profiles usa user_id separadamente
          email: email,
          full_name: "",
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }
  };

  // Busca ou cria o endereço de envio do usuário
  const getOrCreateShippingAddress = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      setError(authError?.message || "Usuário não autenticado");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Garante que o perfil existe antes de prosseguir
      await ensureProfileExists(user.id, user.email || "");

      // Busca o perfil do usuário para obter informações adicionais
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // Verifica se já existe um endereço padrão
      const { data: existingAddress, error: fetchError } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingAddress) {
        // Se o endereço existente não tem email ou telefone, mas o perfil tem, atualize-o
        if (userProfile && (!existingAddress.email || !existingAddress.phone)) {
          const updatedAddress = {
            ...existingAddress,
            email: existingAddress.email || userProfile.email || user.email || "",
            phone: existingAddress.phone || userProfile.phone || "",
            full_name: existingAddress.full_name || userProfile.full_name || "",
          };

          // Atualiza o endereço com as informações do perfil
          const { data: updated, error: updateError } = await supabase
            .from("shipping_addresses")
            .update(updatedAddress)
            .eq("id", existingAddress.id)
            .select()
            .single();

          if (updateError) throw updateError;

          setShippingAddress(updated);
          return updated;
        }

        setShippingAddress(existingAddress);
        return existingAddress;
      }

      // Cria um novo endereço se não existir
      const newAddress: ShippingAddress = {
        id: crypto.randomUUID(),
        user_id: user.id,
        full_name: userProfile?.full_name || "",
        email: user.email || "",
        phone: userProfile?.phone || "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdAddress, error: createError } = await supabase
        .from("shipping_addresses")
        .insert([newAddress])
        .select()
        .single();

      if (createError) throw createError;

      setShippingAddress(createdAddress);
      return createdAddress;
    } catch (err: any) {
      setError(err.message || "Erro ao carregar endereço de envio");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualiza o endereço de envio
  const updateShippingAddress = async (addressData: Partial<ShippingAddress>) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      setError(authError?.message || "Usuário não autenticado");
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Garante que o perfil existe antes de prosseguir
      await ensureProfileExists(user.id, user.email || "");

      const updatedAddress = {
        ...addressData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      let data: ShippingAddress;
      if (shippingAddress?.id) {
        // Atualiza o endereço existente
        const { data: updated, error } = await supabase
          .from("shipping_addresses")
          .update(updatedAddress)
          .eq("id", shippingAddress.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        data = updated;
      } else {
        // Cria um novo endereço
        const newAddress: ShippingAddress = {
          id: crypto.randomUUID(),
          user_id: user.id,
          full_name: addressData.full_name || "",
          email: addressData.email || user.email || "",
          phone: addressData.phone || "",
          address: addressData.address || "",
          city: addressData.city || "",
          state: addressData.state || "",
          postal_code: addressData.postal_code || "",
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: created, error } = await supabase
          .from("shipping_addresses")
          .insert([newAddress])
          .select()
          .single();

        if (error) throw error;
        data = created;
      }

      setShippingAddress(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar endereço");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verifica se o endereço está completo
  const isAddressComplete = () => {
    return (
      shippingAddress?.full_name &&
      shippingAddress?.address &&
      shippingAddress?.city &&
      shippingAddress?.state &&
      shippingAddress?.postal_code
    );
  };

  useEffect(() => {
    // Busca o endereço do usuário quando o hook é inicializado
    getOrCreateShippingAddress();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    shippingAddress,
    loading,
    error,
    success,
    updateShippingAddress,
    isAddressComplete,
    refreshShippingAddress: getOrCreateShippingAddress,
  };
};