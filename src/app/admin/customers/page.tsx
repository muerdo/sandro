"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, AlertCircle, X, Save, User, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function ProfilesManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState<string | null>(null);
  const [editProfileForm, setEditProfileForm] = useState<Partial<any>>({});
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [editAddressForm, setEditAddressForm] = useState<Partial<any>>({});
  const [loading, setLoading] = useState({
    profiles: true,
    addresses: true,
    action: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "profile" | "address"; id: string } | null>(null);

  // Verifica se o usuário é admin
  const checkAdminStatus = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/");
      return;
    }

    setIsAdmin(true);
  };

  // Busca perfis
  const fetchProfiles = async () => {
    try {
      setLoading((prev) => ({ ...prev, profiles: true }));
      const { data, error } = await supabase.from("profiles").select("*");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading((prev) => ({ ...prev, profiles: false }));
    }
  };

  // Busca endereços de entrega
  const fetchShippingAddresses = async () => {
    try {
      setLoading((prev) => ({ ...prev, addresses: true }));
      const { data, error } = await supabase.from("shipping_addresses").select("*");

      if (error) throw error;
      setShippingAddresses(data || []);
    } catch (error) {
      console.error("Error fetching shipping addresses:", error);
      toast.error("Failed to load shipping addresses");
    } finally {
      setLoading((prev) => ({ ...prev, addresses: false }));
    }
  };

  // Atualiza um perfil
  const handleUpdateProfile = async () => {
    if (!isEditingProfile) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));
      const { error } = await supabase
        .from("profiles")
        .update(editProfileForm)
        .eq("id", isEditingProfile);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setIsEditingProfile(null);
      setEditProfileForm({});
      fetchProfiles();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Atualiza um endereço de entrega
  const handleUpdateAddress = async () => {
    if (!isEditingAddress) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));
      const { error } = await supabase
        .from("shipping_addresses")
        .update(editAddressForm)
        .eq("id", isEditingAddress);

      if (error) throw error;

      toast.success("Address updated successfully");
      setIsEditingAddress(null);
      setEditAddressForm({});
      fetchShippingAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Exclui um perfil ou endereço
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));
      const { error } = await supabase
        .from(itemToDelete.type === "profile" ? "profiles" : "shipping_addresses")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;

      toast.success(`${itemToDelete.type === "profile" ? "Profile" : "Address"} deleted successfully`);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      itemToDelete.type === "profile" ? fetchProfiles() : fetchShippingAddresses();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      fetchProfiles();
      fetchShippingAddresses();
    }
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Profiles & Addresses Management</h1>

        {/* Lista de Perfis */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Profiles</h2>
          <div className="grid grid-cols-1 gap-6">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-6 rounded-xl shadow-lg"
              >
                {isEditingProfile === profile.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={editProfileForm.full_name || profile.full_name}
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
                        value={editProfileForm.username || profile.username}
                        onChange={(e) =>
                          setEditProfileForm({ ...editProfileForm, username: e.target.value })
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
                        <h3 className="text-xl font-semibold">{profile.full_name}</h3>
                        <p className="text-muted-foreground">@{profile.username}</p>
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
            ))}
          </div>
        </div>

        {/* Lista de Endereços de Entrega */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Shipping Addresses</h2>
          <div className="grid grid-cols-1 gap-6">
            {shippingAddresses.map((address) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-6 rounded-xl shadow-lg"
              >
                {isEditingAddress === address.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={editAddressForm.full_name || address.full_name}
                        onChange={(e) =>
                          setEditAddressForm({ ...editAddressForm, full_name: e.target.value })
                        }
                        className="text-xl font-semibold bg-background px-3 py-1 rounded-lg border"
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
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        value={editAddressForm.address || address.address}
                        onChange={(e) =>
                          setEditAddressForm({ ...editAddressForm, address: e.target.value })
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
                        <h3 className="text-xl font-semibold">{address.full_name}</h3>
                        <p className="text-muted-foreground">{address.address}</p>
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
            ))}
          </div>
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
    </main>
  );
}