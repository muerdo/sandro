'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Loader2, Check, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import Image from 'next/image';

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber: string;
  initialized: boolean;
  qrCodeAvailable: boolean;
  qrCodeUrl?: string | null;
  lastUpdated: string;
  lastActivity?: string;
}

export function WhatsAppConfig() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState({
    status: true,
    configure: false,
    test: false,
    qrcode: false,
  });
  const qrCodeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Carregar o status inicial do WhatsApp
  const loadStatus = async () => {
    try {
      setLoading(prev => ({ ...prev, status: true }));
      
      // Adicione timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/whatsapp/status?_t=${timestamp}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar status: ${response.statusText}. ${errorText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      
      // Preencher o formulário com o número atual se existir
      if (data.phoneNumber) {
        setPhoneNumber(data.phoneNumber);
      }
      
      // Se não estiver conectado mas QR code estiver disponível, iniciar polling
      if (!data.connected && data.qrCodeAvailable) {
        startQRCodePolling();
      } else if (data.connected) {
        stopQRCodePolling();
      }
    } catch (error: any) {
      console.error('Erro ao carregar status do WhatsApp:', error);
      toast.error('Erro ao carregar status do WhatsApp');
      
      // Definir um status padrão mesmo com erro
      setStatus({
        connected: false,
        phoneNumber: '',
        initialized: false,
        qrCodeAvailable: false,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };
  
  // Iniciar polling para atualizar QR code periodicamente
  const startQRCodePolling = () => {
    if (qrCodeIntervalRef.current) {
      clearInterval(qrCodeIntervalRef.current);
    }
    
    qrCodeIntervalRef.current = setInterval(() => {
      loadStatus();
    }, 15000); // Atualizar a cada 15 segundos
  };
  
  // Parar polling
  const stopQRCodePolling = () => {
    if (qrCodeIntervalRef.current) {
      clearInterval(qrCodeIntervalRef.current);
      qrCodeIntervalRef.current = null;
    }
  };
  
  // Gerar QR code
  const generateQRCode = async () => {
    try {
      setLoading(prev => ({ ...prev, qrcode: true }));
      
      const response = await fetch('/api/whatsapp/qrcode');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar QR code');
      }
      
      const data = await response.json();
      
      if (data.authenticated) {
        toast.success('WhatsApp já está autenticado!');
        await loadStatus();
        return;
      }
      
      if (data.qrCodeUrl) {
        // Atualizar status com novo timestamp para forçar atualização da imagem
        setStatus(prev => prev ? {
          ...prev,
          qrCodeAvailable: true,
          qrCodeUrl: `${data.qrCodeUrl}?t=${Date.now()}` // Adicionar timestamp para evitar cache
        } : null);
        
        toast.success('QR code gerado com sucesso. Escaneie-o com seu WhatsApp.');
        
        // Iniciar polling para verificar quando o QR code for escaneado
        startQRCodePolling();
      }
    } catch (error: any) {
      console.error('Erro ao gerar QR code:', error);
      toast.error(`Erro ao gerar QR code: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, qrcode: false }));
    }
  };
  
  // Carregar o status na montagem do componente
  useEffect(() => {
    loadStatus();
    
    // Limpar polling quando o componente for desmontado
    return () => {
      stopQRCodePolling();
    };
  }, []);
  
  // Função para configurar o número de telefone
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(prev => ({ ...prev, configure: true }));
      
      const response = await fetch('/api/whatsapp/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao configurar WhatsApp');
      }
      
      await loadStatus();
      toast.success('WhatsApp configurado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao configurar WhatsApp:', error);
      toast.error(`Erro ao configurar WhatsApp: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, configure: false }));
    }
  };
  
  // Função para enviar mensagem de teste
  const sendTestMessage = async () => {
    try {
      setLoading(prev => ({ ...prev, test: true }));
      
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar mensagem de teste');
      }
      
      toast.success('Mensagem de teste enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast.error(`Erro ao enviar mensagem de teste: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, test: false }));
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status do WhatsApp */}
      <div className="bg-card p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Status do WhatsApp
        </h2>
        
        {loading.status ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Status:</span>
              <span className="ml-2">
                {status?.connected ? 'Conectado' : (status?.initialized ? 'Não Autenticado' : 'Não Inicializado')}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium">Número configurado:</span>
              <span className="ml-2">{status?.phoneNumber || 'Nenhum'}</span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium">Última atualização:</span>
              <span className="ml-2">{status?.lastUpdated ? formatDate(status.lastUpdated) : 'N/A'}</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center gap-1"
            onClick={loadStatus}
            disabled={loading.status}
          >
            {loading.status ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading.status ? 'Atualizando...' : 'Atualizar Status'}
          </button>
          
          {status && !status.connected && (
            <button 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition flex items-center gap-1"
              onClick={generateQRCode}
              disabled={loading.qrcode}
            >
              {loading.qrcode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              {loading.qrcode ? 'Gerando...' : 'Gerar QR Code'}
            </button>
          )}
        </div>
      </div>
      
      {/* QR Code */}
      {status && !status.connected && status.qrCodeUrl && (
        <div className="bg-card p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Autenticação WhatsApp
          </h2>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Escaneie o QR code abaixo com seu aplicativo WhatsApp para autenticar:
            </p>
            
            <div className="bg-white p-4 rounded-lg inline-block">
              <Image
                src={`${status.qrCodeUrl}?t=${Date.now()}`} // Adicionar timestamp para evitar cache
                alt="QR Code para WhatsApp"
                width={250}
                height={250}
                className="mx-auto"
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              1. Abra o WhatsApp no seu celular
              <br />
              2. Toque em Menu ou Configurações
              <br />
              3. Selecione WhatsApp Web/Desktop
              <br />
              4. Aponte seu celular para esta tela
            </p>
            
            <p className="text-sm text-amber-500">
              O QR code será atualizado automaticamente a cada 15 segundos
            </p>
          </div>
        </div>
      )}
      
      {/* Configuração do WhatsApp */}
      <div className="bg-card p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Configurar Notificações
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Número do WhatsApp para Receber Notificações
            </label>
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: +5511999999999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              disabled={loading.configure}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Insira o número completo com código do país e DDD (ex: +5511999999999)
            </p>
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded flex items-center gap-1"
            disabled={loading.configure}
          >
            {loading.configure ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading.configure ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </form>
      </div>
      
      {/* Teste de Notificações */}
      <div className="bg-card p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Teste de Notificações
        </h2>
        
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <h3 className="font-medium mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Sobre o sistema de notificações
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            O sistema envia notificações automáticas para o WhatsApp quando
            novos pedidos são realizados na loja.
          </p>
          <p className="text-sm text-gray-600">
            As notificações incluem detalhes como dados do cliente, 
            itens do pedido e valores totais.
          </p>
        </div>
        
        <button
          onClick={sendTestMessage}
          disabled={loading.test || !status?.connected}
          className="px-4 py-2 bg-primary text-white rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.test ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          {loading.test ? 'Enviando...' : 'Enviar Mensagem de Teste'}
        </button>
      </div>
    </div>
  );
}