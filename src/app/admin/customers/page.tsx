"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, AlertCircle, X, Save, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js"; // Importa o tipo de erro

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  role: string;
  shipping_addresses: ShippingAddress[];
};

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
};

export default function ProfilesManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState({
    profiles: true,
    action: false,
  });
  const [isEditingProfile, setIsEditingProfile] = useState<string | null>(null);
  const [editProfileForm, setEditProfileForm] = useState<Partial<Profile>>({});
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [editAddressForm, setEditAddressForm] = useState<Partial<ShippingAddress>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "profile" | "address"; id: string } | null>(null);

  // Verifica se o usuário é admin
  const checkAdminStatus = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      router.push("/");
      return;
    }

    setIsAdmin(true);
  };

  // Busca perfis com seus endereços associados
  const fetchProfilesWithAddresses = async () => {
    try {
      setLoading((prev) => ({ ...prev, profiles: true }));
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          full_name,
          email,
          role,
          shipping_addresses (
            id,
            user_id,
            full_name,
            email,
            phone,
            address,
            city,
            state,
            postal_code,
            is_default
          )
        `) as { data: Profile[] | null; error: PostgrestError | null }; // Tipagem explícita

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles and addresses:", error);
      toast.error("Failed to load profiles and addresses");
    } finally {
      setLoading((prev) => ({ ...prev, profiles: false }));
    }
  };

  // Atualiza um perfil (auth.users + public.profiles)
  const handleUpdateProfile = async () => {
    if (!isEditingProfile) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));

      // Obter o perfil atual para comparar com as alterações
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", isEditingProfile)
        .single();

      if (fetchError) throw fetchError;

      if (!currentProfile) {
        throw new Error("Profile not found");
      }

      // 1. Atualizar o usuário no auth.users
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        isEditingProfile,
        {
          email: editProfileForm.email !== currentProfile.email ? editProfileForm.email : undefined,
          user_metadata: {
            full_name: editProfileForm.full_name || currentProfile.full_name || '',
            username: editProfileForm.username || currentProfile.username || '',
          },
          app_metadata: {
            role: editProfileForm.role || currentProfile.role || 'customer'
          }
        }
      );

      if (updateAuthError) throw updateAuthError;

      // 2. Atualizar o perfil no public.profiles
      const { error } = await supabase
        .from("profiles")
        .update({
          ...editProfileForm,
          updated_at: new Date().toISOString()
        })
        .eq("id", isEditingProfile);

      if (error) throw error;

      toast.success("User and profile updated successfully");
      setIsEditingProfile(null);
      setEditProfileForm({});
      fetchProfilesWithAddresses();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Atualiza um endereço de entrega
  const handleUpdateAddress = async () => {
    if (!isEditingAddress) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));

      // Obter o endereço atual para verificar mudanças
      const { data: currentAddress, error: fetchError } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("id", isEditingAddress)
        .single();

      if (fetchError) throw fetchError;

      if (!currentAddress) {
        throw new Error("Address not found");
      }

      // Se o endereço for definido como padrão e não era antes, atualizar outros endereços do usuário
      if (editAddressForm.is_default && !currentAddress.is_default) {
        const { error: updateError } = await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', currentAddress.user_id);

        if (updateError) {
          console.error('Error updating existing addresses:', updateError);
          // Continuar mesmo se houver erro
        }
      }

      // Atualizar o endereço
      const { error } = await supabase
        .from("shipping_addresses")
        .update({
          ...editAddressForm,
          updated_at: new Date().toISOString()
        })
        .eq("id", isEditingAddress);

      if (error) throw error;

      toast.success("Address updated successfully");
      setIsEditingAddress(null);
      setEditAddressForm({});
      fetchProfilesWithAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error(`Failed to update address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Exclui um perfil (auth.users + public.profiles) ou endereço
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));

      if (itemToDelete.type === "profile") {
        // 1. Excluir endereços associados ao perfil
        const { error: addressesError } = await supabase
          .from("shipping_addresses")
          .delete()
          .eq("user_id", itemToDelete.id);

        if (addressesError) {
          console.error("Error deleting associated addresses:", addressesError);
          // Continuar mesmo se houver erro ao excluir endereços
        }

        // 2. Excluir o perfil do public.profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", itemToDelete.id);

        if (profileError) throw profileError;

        // 3. Excluir o usuário do auth.users
        const { error: authError } = await supabase.auth.admin.deleteUser(itemToDelete.id);

        if (authError) {
          console.error("Error deleting user from auth.users:", authError);
          // Continuar mesmo se houver erro ao excluir do auth.users
        }

        toast.success("User, profile and associated addresses deleted successfully");
      } else {
        // Excluir apenas o endereço
        const { error } = await supabase
          .from("shipping_addresses")
          .delete()
          .eq("id", itemToDelete.id);

        if (error) throw error;

        toast.success("Address deleted successfully");
      }

      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchProfilesWithAddresses();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${itemToDelete.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Estado para controlar a criação de novo perfil
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState<Partial<Profile>>({
    username: '',
    full_name: '',
    email: '',
    role: 'customer'
  });

  // Estado para controlar a criação de novo endereço
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [selectedProfileForAddress, setSelectedProfileForAddress] = useState<string | null>(null);
  const [newAddressForm, setNewAddressForm] = useState<Partial<ShippingAddress>>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false
  });

  // Cria um novo perfil (auth.users + public.profiles)
  const handleCreateProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      // Validar dados
      if (!newProfileForm.email) {
        toast.error('Email is required');
        return;
      }

      // Gerar uma senha aleatória para o usuário
      const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      const randomPassword = generateRandomPassword();

      // Verificar se o email já existe no auth.users
      const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserByEmail(newProfileForm.email);

      if (authCheckError && authCheckError.message !== 'User not found') {
        throw authCheckError;
      }

      if (authUser) {
        toast.error('A user with this email already exists');
        return;
      }

      // Verificar se o email já existe em profiles
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newProfileForm.email);

      if (checkError) throw checkError;

      if (existingProfiles && existingProfiles.length > 0) {
        toast.error('A profile with this email already exists');
        return;
      }

      // 1. Criar usuário no auth.users
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: newProfileForm.email,
        password: randomPassword,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          full_name: newProfileForm.full_name || '',
          username: newProfileForm.username || '',
        },
        app_metadata: {
          role: newProfileForm.role || 'customer'
        }
      });

      if (createUserError) throw createUserError;

      if (!newUser || !newUser.user) {
        throw new Error('Failed to create user in auth.users');
      }

      const userId = newUser.user.id;

      // 2. Criar perfil no public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId, // Usar o mesmo ID do auth.users
          username: newProfileForm.username || '',
          full_name: newProfileForm.full_name || '',
          email: newProfileForm.email,
          role: newProfileForm.role || 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        // Se falhar ao criar o perfil, tentar excluir o usuário criado no auth.users
        await supabase.auth.admin.deleteUser(userId);
        throw error;
      }

      toast.success('User and profile created successfully');
      setIsCreatingProfile(false);
      setNewProfileForm({
        username: '',
        full_name: '',
        email: '',
        role: 'customer'
      });
      fetchProfilesWithAddresses();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Cria um novo endereço associado a um perfil
  const handleCreateAddress = async () => {
    if (!selectedProfileForAddress) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      // Validar dados
      if (!newAddressForm.address) {
        toast.error('Address is required');
        return;
      }

      // Verificar se o perfil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedProfileForAddress)
        .single();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error('Selected profile does not exist');
        return;
      }

      // Se o endereço for definido como padrão, atualizar outros endereços do usuário
      if (newAddressForm.is_default) {
        const { error: updateError } = await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', selectedProfileForAddress);

        if (updateError) {
          console.error('Error updating existing addresses:', updateError);
          // Continuar mesmo se houver erro
        }
      }

      // Preencher automaticamente o nome e email se não fornecidos
      const addressData = {
        ...newAddressForm,
        full_name: newAddressForm.full_name || profile.full_name || '',
        email: newAddressForm.email || profile.email || '',
        id: crypto.randomUUID(),
        user_id: selectedProfileForAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Criar endereço
      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert(addressData)
        .select();

      if (error) throw error;

      toast.success('Address created successfully');
      setIsCreatingAddress(false);
      setSelectedProfileForAddress(null);
      setNewAddressForm({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        is_default: false
      });
      fetchProfilesWithAddresses();
    } catch (error) {
      console.error('Error creating address:', error);
      toast.error(`Failed to create address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  useEffect(() => {
    // Verifica se já carregamos os dados nesta sessão
    const customersLoaded = sessionStorage.getItem('admin_customers_loaded');

    // Verifica o status de admin apenas uma vez
    checkAdminStatus();

    // Se for admin e ainda não carregamos os dados, carrega-os
    if (isAdmin && !customersLoaded) {
      fetchProfilesWithAddresses();

      // Marca que já carregamos os dados
      sessionStorage.setItem('admin_customers_loaded', 'true');
    }
  }, [isAdmin]); // Dependemos apenas do status de admin

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Profiles & Addresses Management</h1>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                toast.info('Atualizando perfis...');
                fetchProfilesWithAddresses();
              }}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Refresh Profiles
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreatingProfile(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Profile
            </motion.button>
          </div>
        </div>

        {/* Lista de Perfis e Endereços */}
        <div className="space-y-12">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-card p-6 rounded-xl shadow-lg">
              {/* Perfil */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                {isEditingProfile === profile.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={editProfileForm.full_name || profile.full_name || ""}
                        onChange={(e) =>
                          setEditProfileForm({ ...editProfileForm, full_name: e.target.value })
                        }
                        className="text-xl font-semibold bg-background px-3 py-1 rounded-lg border"
                      />
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleUpdateProfile}
                          className="p-2 bg-primary text-primary-foreground rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsEditingProfile(null)}
                          className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={editProfileForm.username || profile.username || ""}
                        onChange={(e) =>
                          setEditProfileForm({ ...editProfileForm, username: e.target.value })
                        }
                        className="w-full bg-background px-3 py-1 rounded-lg border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={editProfileForm.email || profile.email || ""}
                        onChange={(e) =>
                          setEditProfileForm({ ...editProfileForm, email: e.target.value })
                        }
                        className="w-full bg-background px-3 py-1 rounded-lg border"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{profile.full_name || "No Name"}</h3>
                        <p className="text-muted-foreground">@{profile.username || "No Username"}</p>
                        <p className="text-muted-foreground">{profile.email || "No Email"}</p>
                        <p className="text-muted-foreground">Role: {profile.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setIsEditingProfile(profile.id);
                          setEditProfileForm(profile);
                        }}
                        className="p-2 bg-primary/10 text-primary rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setItemToDelete({ type: "profile", id: profile.id });
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 bg-destructive/10 text-destructive rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Endereços Associados */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold">Shipping Addresses</h4>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedProfileForAddress(profile.id);
                      setIsCreatingAddress(true);
                    }}
                    className="p-2 bg-primary/10 text-primary rounded-lg flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add Address
                  </motion.button>
                </div>
                {profile.shipping_addresses.length > 0 ? (
                  profile.shipping_addresses.map((address) => (
                    <motion.div
                      key={address.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-muted p-4 rounded-lg"
                    >
                      {isEditingAddress === address.id ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={editAddressForm.full_name || address.full_name || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, full_name: e.target.value })
                              }
                              className="text-lg font-semibold bg-background px-3 py-1 rounded-lg border"
                            />
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleUpdateAddress}
                                className="p-2 bg-primary text-primary-foreground rounded-lg"
                              >
                                <Save className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsEditingAddress(null)}
                                className="p-2 bg-destructive text-destructive-foreground rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                              type="email"
                              value={editAddressForm.email || address.email || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, email: e.target.value })
                              }
                              className="w-full bg-background px-3 py-1 rounded-lg border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                              type="text"
                              value={editAddressForm.phone || address.phone || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, phone: e.target.value })
                              }
                              className="w-full bg-background px-3 py-1 rounded-lg border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <input
                              type="text"
                              value={editAddressForm.address || address.address || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, address: e.target.value })
                              }
                              className="w-full bg-background px-3 py-1 rounded-lg border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">City</label>
                            <input
                              type="text"
                              value={editAddressForm.city || address.city || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, city: e.target.value })
                              }
                              className="w-full bg-background px-3 py-1 rounded-lg border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">State</label>
                            <input
                              type="text"
                              value={editAddressForm.state || address.state || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, state: e.target.value })
                              }
                              className="w-full bg-background px-3 py-1 rounded-lg border"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Postal Code</label>
                            <input
                              type="text"
                              value={editAddressForm.postal_code || address.postal_code || ""}
                              onChange={(e) =>
                                setEditAddressForm({ ...editAddressForm, postal_code: e.target.value })
                              }
                              className="w-full bg-background px-3 py-1 rounded-lg border"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold">{address.full_name || "No Name"}</h5>
                              <p className="text-muted-foreground">{address.email || "No Email"}</p>
                              <p className="text-muted-foreground">{address.phone || "No Phone"}</p>
                              <p className="text-muted-foreground">
                                {address.address || "No Address"}, {address.city || "No City"},{" "}
                                {address.state || "No State"}, {address.postal_code || "No Postal Code"}
                              </p>
                              <p className="text-muted-foreground">
                                Default: {address.is_default ? "Yes" : "No"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setIsEditingAddress(address.id);
                                setEditAddressForm(address);
                              }}
                              className="p-2 bg-primary/10 text-primary rounded-lg"
                            >
                              <Pencil className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setItemToDelete({ type: "address", id: address.id });
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 bg-destructive/10 text-destructive rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No shipping addresses for this profile.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Confirmação de Exclusão */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this {itemToDelete?.type}?
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formulário para criar novo perfil */}
      {isCreatingProfile && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Profile</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCreatingProfile(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={newProfileForm.email || ''}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={newProfileForm.username || ''}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={newProfileForm.full_name || ''}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={newProfileForm.role || 'customer'}
                  onChange={(e) => setNewProfileForm({ ...newProfileForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreatingProfile(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateProfile}
                disabled={loading.action || !newProfileForm.email}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2"
              >
                {loading.action ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Profile
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário para criar novo endereço */}
      {isCreatingAddress && selectedProfileForAddress && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Address</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsCreatingAddress(false);
                  setSelectedProfileForAddress(null);
                }}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAddressForm.full_name || ''}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newAddressForm.email || ''}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={newAddressForm.phone || ''}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input
                  type="text"
                  value={newAddressForm.address || ''}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={newAddressForm.city || ''}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={newAddressForm.state || ''}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  value={newAddressForm.postal_code || ''}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, postal_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newAddressForm.is_default || false}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, is_default: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_default" className="text-sm">Set as default address</label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsCreatingAddress(false);
                  setSelectedProfileForAddress(null);
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateAddress}
                disabled={loading.action || !newAddressForm.address}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2"
              >
                {loading.action ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Address
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}