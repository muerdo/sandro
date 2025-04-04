// src/lib/whatsapp-notification.ts

export interface OrderItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
  }
  
  export interface OrderResponse {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    payment_method: string | null;
    payment_status: string;
    items: OrderItem[];
    shipping_address_id?: string;
    created_at: string;
    updated_at?: string;
    profiles?: {
      username: string;
      phone?: string;
    };
  }
  
  // Configuração global
  let whatsAppConfig: {
    phoneNumber: string;
    configured: boolean;
    lastUpdated: string;
    enabled: boolean;
  } = {
    phoneNumber: '',
    configured: false,
    lastUpdated: '',
    enabled: false
  };
  
  // Histórico de mensagens
  const whatsAppMessages: {
    id: string;
    phoneNumber: string;
    message: string;
    timestamp: string;
    status: 'sent' | 'pending' | 'failed';
  }[] = [];
  
  /**
   * Funções utilitárias
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };
  
  /**
   * Configuração do serviço
   */
  export async function configureWhatsApp(phoneNumber: string, enable: boolean = true) {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    if (!formattedNumber) {
      throw new Error('Número de telefone inválido');
    }
  
    whatsAppConfig = {
      phoneNumber: formattedNumber,
      configured: true,
      lastUpdated: new Date().toISOString(),
      enabled: enable
    };
  
    console.log(`WhatsApp configurado para: ${formattedNumber}`);
    return { success: true, phoneNumber: formattedNumber };
  }
  
  export async function getWhatsAppStatus() {
    return {
      connected: whatsAppConfig.configured && whatsAppConfig.enabled,
      phoneNumber: whatsAppConfig.phoneNumber,
      lastUpdated: whatsAppConfig.lastUpdated,
      enabled: whatsAppConfig.enabled
    };
  }
  
  export async function toggleWhatsAppService(enable: boolean) {
    if (!whatsAppConfig.configured) {
      throw new Error('Configure um número primeiro');
    }
    whatsAppConfig.enabled = enable;
    return { success: true, enabled: enable };
  }
  
  /**
   * Envio de mensagens
   */
  export async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    isTest: boolean = false
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Validações
      if (!phoneNumber || !message) {
        throw new Error('Número e mensagem são obrigatórios');
      }
  
      const formattedNumber = formatPhoneNumber(phoneNumber);
      if (formattedNumber.length < 11) {
        throw new Error('Número de telefone inválido');
      }
  
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 800));
  
      // Registrar mensagem
      const messageId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      whatsAppMessages.push({
        id: messageId,
        phoneNumber: formattedNumber,
        message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      });
  
      // Log detalhado em desenvolvimento
      if (process.env.NODE_ENV === 'development' || isTest) {
        console.log('\n========== NOTIFICAÇÃO WHATSAPP ==========');
        console.log(`Para: ${formattedNumber}`);
        console.log(`Mensagem (${message.length} caracteres):`);
        console.log(message);
        console.log('==========================================\n');
      }
  
      // Integração real (exemplo com Twilio)
      if (process.env.NODE_ENV === 'production' && whatsAppConfig.enabled) {
        /*
        const response = await fetch('https://api.twilio.com/...', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`
          },
          body: JSON.stringify({
            to: `whatsapp:${formattedNumber}`,
            body: message
          })
        });
  
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.statusText}`);
        }
        */
      }
  
      return { success: true, messageId };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error instanceof Error ? error.message : error);
      return { success: false };
    }
  }
  
  /**
   * Notificações específicas
   */
  export async function sendTestMessage(): Promise<{ success: boolean; testMessage?: string }> {
    if (!whatsAppConfig.configured) {
      throw new Error('WhatsApp não configurado');
    }
  
    const testMessage = 
      `🔔 *TESTE DE NOTIFICAÇÃO* 🔔\n\n` +
      `Esta é uma mensagem de teste do sistema\n\n` +
      `Data: ${new Date().toLocaleString('pt-BR')}\n` +
      `Número configurado: ${whatsAppConfig.phoneNumber}`;
  
    const result = await sendWhatsAppMessage(
      whatsAppConfig.phoneNumber,
      testMessage,
      true
    );
  
    return {
      success: result.success,
      testMessage: result.success ? testMessage : undefined
    };
  }
  
  export async function sendOrderNotification(
    order: OrderResponse,
    recipient: 'admin' | 'customer' = 'admin'
  ): Promise<{ success: boolean; notification?: string }> {
    try {
      if (!whatsAppConfig.configured) {
        throw new Error('Serviço WhatsApp não configurado');
      }
  
      // Determinar destinatário
      const targetPhone = recipient === 'admin' 
        ? whatsAppConfig.phoneNumber
        : order.profiles?.phone || '';
  
      if (!targetPhone) {
        throw new Error(`Número do ${recipient} não disponível`);
      }
  
      // Formatando itens do pedido
      const itemsList = order.items.map(item =>
        `➤ ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`
      ).join('\n');
  
      // Criar mensagem personalizada
      let message = '';
      if (recipient === 'admin') {
        message = 
          `🛒 *NOVO PEDIDO - ${order.id.slice(0, 8).toUpperCase()}* 🛒\n\n` +
          `📅 ${formatDate(order.created_at)}\n` +
          `👤 ${order.profiles?.username || 'Cliente'}\n\n` +
          `📦 *Itens:*\n${itemsList}\n\n` +
          `💰 *Total: ${formatCurrency(order.total_amount)}*\n` +
          `💳 *Pagamento: ${order.payment_method || 'Não especificado'}*\n` +
          `📊 *Status: ${order.status.toUpperCase()}*`;
      } else {
        message = 
          `✅ *SEU PEDIDO FOI RECEBIDO!* ✅\n\n` +
          `Nº do pedido: ${order.id.slice(0, 8).toUpperCase()}\n\n` +
          `📦 *Seus itens:*\n${itemsList}\n\n` +
          `💰 *Valor total: ${formatCurrency(order.total_amount)}*\n\n` +
          `Acompanhe seu pedido em nosso site.`;
      }
  
      const result = await sendWhatsAppMessage(targetPhone, message);
  
      return {
        success: result.success,
        notification: result.success ? message : undefined
      };
    } catch (error) {
      console.error('Erro na notificação de pedido:', error instanceof Error ? error.message : error);
      return { success: false };
    }
  }
  
  /**
   * Obter histórico de mensagens (para debug)
   */
  export function getMessageHistory(limit: number = 20) {
    return whatsAppMessages
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }