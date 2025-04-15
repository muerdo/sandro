"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, User, MapPin } from "lucide-react";
import { IMaskInput } from "react-imask";
import { useShippingAddress } from "@/hooks/useShippingAddress";

// Nota: Metadados são definidos em um arquivo separado para componentes Server

// Tipo para o perfil do usuário
type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// Tipo para o endereço de entrega
type ShippingAddress = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { shippingAddress, setShippingAddress } = useShippingAddress();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState({
    page: true,
    profile: false,
    address: false,
  });

  // Estados para formulários
  const [profileForm, setProfileForm] = useState({
    username: "",
    full_name: "",
    email: "",
  });

  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    id: "",
    user_id: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    is_default: true,
    created_at: null,
    updated_at: null,
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Você precisa estar logado para acessar esta página");
          router.push("/login");
          return;
        }

        setUser(user);
        await fetchUserProfile(user.id);
        await fetchUserAddresses(user.id);
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        toast.error("Erro ao carregar informações do usuário");
      } finally {
        setLoading(prev => ({ ...prev, page: false }));
      }
    };

    checkUser();
  }, [router]);

  // Buscar perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
      setProfileForm({
        username: data.username || "",
        full_name: data.full_name || "",
        email: data.email || "",
      });
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      toast.error("Erro ao carregar perfil");
    }
  };

  // Buscar endereços do usuário
  const fetchUserAddresses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (error) throw error;

      setAddresses(data || []);

      // Se houver um endereço padrão, selecione-o
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setAddressForm(defaultAddress);

        // Atualizar o contexto de endereço de entrega
        setShippingAddress(defaultAddress);
      } else if (data && data.length > 0) {
        // Se não houver endereço padrão, selecione o primeiro
        setSelectedAddressId(data[0].id);
        setAddressForm(data[0]);

        // Atualizar o contexto de endereço de entrega
        setShippingAddress(data[0]);
      } else {
        // Se não houver endereços, prepare para criar um novo
        setIsCreatingAddress(true);
        setAddressForm({
          ...addressForm,
          user_id: userId,
          full_name: profile?.full_name || "",
          email: profile?.email || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      toast.error("Erro ao carregar endereços");
    }
  };

  // Atualizar perfil do usuário
  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    setLoading(prev => ({ ...prev, profile: true }));

    try {
      // Validar dados
      if (!profileForm.email) {
        toast.error("Email é obrigatório");
        return;
      }

      // Atualizar perfil no Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profileForm.username,
          full_name: profileForm.full_name,
          email: profileForm.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Atualizar metadados do usuário no Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name,
          username: profileForm.username,
        }
      });

      if (authError) {
        console.error("Erro ao atualizar metadados do usuário:", authError);
        // Continuar mesmo com erro nos metadados
      }

      toast.success("Perfil atualizado com sucesso");
      await fetchUserProfile(user.id);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Atualizar ou criar endereço
  const handleSaveAddress = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, address: true }));

    try {
      // Validar dados
      if (!addressForm.address || !addressForm.phone) {
        toast.error("Endereço e telefone são obrigatórios");
        return;
      }

      // Se for endereço padrão, atualizar outros endereços
      if (addressForm.is_default && addresses.length > 0) {
        await supabase
          .from("shipping_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", addressForm.id || "new");
      }

      if (isCreatingAddress || !selectedAddressId) {
        // Criar novo endereço
        const { data, error } = await supabase
          .from("shipping_addresses")
          .insert({
            ...addressForm,
            id: crypto.randomUUID(),
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;

        toast.success("Endereço criado com sucesso");
        setIsCreatingAddress(false);

        // Atualizar o contexto de endereço de entrega
        if (data && data.length > 0) {
          setShippingAddress(data[0]);
        }
      } else {
        // Atualizar endereço existente
        const { data, error } = await supabase
          .from("shipping_addresses")
          .update({
            ...addressForm,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedAddressId)
          .select();

        if (error) throw error;

        toast.success("Endereço atualizado com sucesso");

        // Atualizar o contexto de endereço de entrega
        if (data && data.length > 0) {
          setShippingAddress(data[0]);
        }
      }

      await fetchUserAddresses(user.id);
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      toast.error("Erro ao salvar endereço");
    } finally {
      setLoading(prev => ({ ...prev, address: false }));
    }
  };

  // Selecionar endereço para edição
  const handleSelectAddress = (addressId: string) => {
    const selected = addresses.find(addr => addr.id === addressId);
    if (selected) {
      setSelectedAddressId(addressId);
      setAddressForm(selected);
      setIsCreatingAddress(false);
    }
  };

  // Preparar para criar novo endereço
  const handleNewAddress = () => {
    setIsCreatingAddress(true);
    setSelectedAddressId(null);
    setAddressForm({
      id: "",
      user_id: user?.id || "",
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      is_default: addresses.length === 0, // Primeiro endereço é padrão
      created_at: null,
      updated_at: null,
    });
  };

  if (loading.page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações Pessoais
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereços de Entrega
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais. Estas informações serão usadas para contato e entrega.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={profileForm.username || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="Seu nome de usuário"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="seu.email@exemplo.com"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpdateProfile}
                disabled={loading.profile}
                className="w-full md:w-auto"
              >
                {loading.profile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Endereços</CardTitle>
                  <CardDescription>
                    Gerencie seus endereços de entrega
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {addresses.length > 0 ? (
                      addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === address.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleSelectAddress(address.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{address.full_name}</p>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                            </div>
                            {address.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1">{address.address}</p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} - {address.postal_code}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Nenhum endereço cadastrado
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleNewAddress}
                    variant="outline"
                    className="w-full"
                  >
                    Adicionar Novo Endereço
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isCreatingAddress ? "Novo Endereço" : "Editar Endereço"}
                  </CardTitle>
                  <CardDescription>
                    {isCreatingAddress
                      ? "Adicione um novo endereço de entrega"
                      : "Edite as informações do endereço selecionado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addr_full_name">Nome Completo</Label>
                      <Input
                        id="addr_full_name"
                        value={addressForm.full_name || ""}
                        onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr_email">Email</Label>
                      <Input
                        id="addr_email"
                        type="email"
                        value={addressForm.email || ""}
                        onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                        placeholder="Email para contato"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addr_phone">Telefone</Label>
                    <IMaskInput
                      id="addr_phone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      mask="+{55} (00) 00000-0000"
                      unmask={false}
                      value={addressForm.phone || ""}
                      onAccept={(value) => setAddressForm({ ...addressForm, phone: value })}
                      placeholder="+55 (00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addr_address">Endereço</Label>
                    <Input
                      id="addr_address"
                      value={addressForm.address || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addr_city">Cidade</Label>
                      <Input
                        id="addr_city"
                        value={addressForm.city || ""}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr_state">Estado</Label>
                      <Input
                        id="addr_state"
                        value={addressForm.state || ""}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="Estado"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addr_postal_code">CEP</Label>
                    <IMaskInput
                      id="addr_postal_code"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      mask="00000-000"
                      unmask={false}
                      value={addressForm.postal_code || ""}
                      onAccept={(value) => setAddressForm({ ...addressForm, postal_code: value })}
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is_default" className="text-sm font-normal">
                      Definir como endereço padrão
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSaveAddress}
                    disabled={loading.address}
                    className="w-full sm:w-auto"
                  >
                    {loading.address ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Endereço
                      </>
                    )}
                  </Button>

                  {!isCreatingAddress && addresses.length > 1 && (
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        if (!selectedAddressId) return;

                        try {
                          setLoading(prev => ({ ...prev, address: true }));

                          const { error } = await supabase
                            .from("shipping_addresses")
                            .delete()
                            .eq("id", selectedAddressId);

                          if (error) throw error;

                          toast.success("Endereço removido com sucesso");
                          await fetchUserAddresses(user.id);
                        } catch (error) {
                          console.error("Erro ao remover endereço:", error);
                          toast.error("Erro ao remover endereço");
                        } finally {
                          setLoading(prev => ({ ...prev, address: false }));
                        }
                      }}
                    >
                      Remover Endereço
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
