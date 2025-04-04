"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type AuthStateChangeCallback = (event: 'SIGNED_IN' | 'SIGNED_OUT', user: User | null) => void;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  onAuthStateChange: (callback: AuthStateChangeCallback) => () => void;
  refreshSession: () => Promise<void>; // Função para atualizar a sessão manualmente
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authStateCallbacks, setAuthStateCallbacks] = useState<AuthStateChangeCallback[]>([]);
  const router = useRouter();

  const checkUserRole = useCallback(async (userId: string) => {
    try {
      // Adiciona um cache para evitar chamadas repetidas
      const cacheKey = `admin_role_${userId}`;
      const cachedRole = sessionStorage.getItem(cacheKey);

      // Se já verificamos o papel deste usuário nesta sessão, use o valor em cache
      if (cachedRole) {
        return cachedRole === 'true';
      }

      // Se não há cache, faz a chamada à API
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Armazena o resultado no cache da sessão
      const isAdmin = profile?.role === "admin";
      sessionStorage.setItem(cacheKey, isAdmin.toString());

      return isAdmin;
    } catch (error) {
      console.error("Error checking user role:", error);
      return false;
    }
  }, []);

  const handleAuthStateChange = useCallback(async (currentUser: User | null, event?: 'SIGNED_IN' | 'SIGNED_OUT') => {
    try {
      // Armazena o usuário anterior para uso em callbacks
      const previousUser = user;

      if (currentUser) {
        const isUserAdmin = await checkUserRole(currentUser.id);
        setUser(currentUser);
        setIsAdmin(isUserAdmin);
      } else {
        setUser(null);
        setIsAdmin(false);
      }

      if (event) {
        // Passa o usuário anterior para os callbacks no caso de SIGNED_OUT
        // para que possam limpar dados específicos do usuário
        const userForCallback = event === 'SIGNED_OUT' ? previousUser : currentUser;
        authStateCallbacks.forEach(callback => callback(event, userForCallback));
      }
    } catch (error) {
      console.error("Error handling auth state change:", error);
    }
  }, [checkUserRole, authStateCallbacks, user]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (mounted) {
          await handleAuthStateChange(session?.user ?? null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        await handleAuthStateChange(session?.user ?? null, event as 'SIGNED_IN' | 'SIGNED_OUT');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data: { user: signedInUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!signedInUser) throw new Error("Login failed");

      await handleAuthStateChange(signedInUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleAuthStateChange]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) throw signUpError;
      if (!newUser) throw new Error("Registration failed");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: newUser.id,
          username: null,
          avatar_url: "",
          full_name: fullName || "",
          role: "user",
          email: newUser.email,
        });

      if (profileError) throw profileError;
      await handleAuthStateChange(newUser);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleAuthStateChange]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);

      // Armazena o usuário atual antes de fazer logout
      const currentUser = user;

      // Limpa explicitamente todos os carrinhos no localStorage
      try {
        // Limpa o carrinho do usuário atual
        if (currentUser?.id) {
          localStorage.removeItem(`cart_${currentUser.id}`);
        }
        // Limpa o carrinho de convidado
        localStorage.removeItem('cart_guest');
        // Limpa o carrinho antigo
        localStorage.removeItem('cart');

        console.log("Carrinhos limpos durante logout");
      } catch (e) {
        console.error("Erro ao limpar carrinhos durante logout:", e);
      }

      // Faz logout no Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Notifica sobre a mudança de estado de autenticação
      await handleAuthStateChange(null, 'SIGNED_OUT');

      // Redireciona para a página inicial
      router.push('/');
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleAuthStateChange, router, user]);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;
      await handleAuthStateChange(session?.user ?? null);
    } catch (error) {
      console.error("Error refreshing session:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleAuthStateChange]);

  const onAuthStateChange = useCallback((callback: AuthStateChangeCallback) => {
    setAuthStateCallbacks(prev => [...prev, callback]);
    return () => {
      setAuthStateCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const contextValue = {
    user,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
    refreshSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

