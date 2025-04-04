"use client";

import AdminNav from "@/components/admin/admin-nav";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading, refreshSession } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se já verificamos o acesso admin nesta sessão
    const adminAccessChecked = sessionStorage.getItem('admin_access_checked');

    const checkAdminAccess = async () => {
      try {
        console.log("Verificando acesso admin:", { user, isAdmin, loading });

        // Se ainda está carregando, não faz nada
        if (loading) {
          console.log("Ainda carregando dados de autenticação...");
          return;
        }

        // Se já está autorizado, não faz nada
        if (isAuthorized) {
          console.log("Usuário já está autorizado");
          return;
        }

        // Se não há usuário ou não é admin, tenta atualizar a sessão uma única vez
        if (!user || !isAdmin) {
          // Verifica se já tentamos atualizar a sessão antes
          const sessionRefreshed = sessionStorage.getItem('admin_session_refreshed');

          if (!sessionRefreshed) {
            console.log("Tentando atualizar sessão...");
            sessionStorage.setItem('admin_session_refreshed', 'true');
            await refreshSession();

            // Após a atualização, verifica novamente
            if (!user || !isAdmin) {
              console.log("Acesso não autorizado após refresh");
              toast.error("Você não tem permissão para acessar esta área");
              router.push("/");
              return;
            }
          } else {
            // Já tentamos atualizar a sessão antes e ainda não tem acesso
            console.log("Acesso não autorizado e sessão já atualizada");
            toast.error("Você não tem permissão para acessar esta área");
            router.push("/");
            return;
          }
        }

        // Se chegou aqui, o usuário tem acesso
        console.log("Acesso autorizado");
        sessionStorage.setItem('admin_access_checked', 'true');
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar acesso admin:", error);
        toast.error("Erro ao verificar permissões");
        router.push("/");
      }
    };

    // Só executa a verificação se ainda não verificamos ou se o usuário mudou
    if (!adminAccessChecked || !isAuthorized) {
      checkAdminAccess();
    } else {
      // Se já verificamos e está autorizado, apenas atualiza o estado
      setIsAuthorized(true);
      setIsLoading(false);
    }

    // Define um timeout para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Timeout de carregamento atingido, verificando estado atual");
        if (user && isAdmin) {
          console.log("Usuário tem permissões, liberando acesso");
          sessionStorage.setItem('admin_access_checked', 'true');
          setIsAuthorized(true);
          setIsLoading(false);
        } else if (!loading) {
          console.log("Sem permissões após timeout, redirecionando");
          toast.error("Tempo limite excedido. Redirecionando...");
          router.push("/");
        }
      }
    }, 5000); // 5 segundos de timeout

    return () => clearTimeout(timeoutId);
  }, [user, isAdmin, loading, refreshSession, router, isLoading, isAuthorized]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex">
      <AdminNav />
      <main className="flex-1 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
