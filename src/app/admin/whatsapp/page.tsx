'use client';

import { useEffect, useState } from 'react';
import { WhatsAppConfig } from '@/components/admin/WhatsAppConfig';
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AlertCircle, MessageSquare, Loader2 } from 'lucide-react';

export default function WhatsAppAdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, checkAdminStatus } = useAdminDashboard();
  
  useEffect(() => {
    const init = async () => {
      await checkAdminStatus();
      setIsLoading(false);
    };
    
    init();
  }, [checkAdminStatus]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Configuração de Notificações WhatsApp</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Configure o sistema de notificações por WhatsApp para receber alertas de novos pedidos e pagamentos.
      </p>
      <WhatsAppConfig />
    </div>
  );
}