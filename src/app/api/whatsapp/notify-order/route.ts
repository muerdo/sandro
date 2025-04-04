import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp-service';
import { createClient } from '@supabase/supabase-js';

// Definir o tipo Database para Supabase
type Database = any; // Substituir pelo tipo real quando disponível

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log("API: Solicitação para notificar sobre pedido recebida");

    // Parse da requisição
    const body = await request.json();
    console.log("API: Corpo da requisição:", body);

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    // Verificar status do serviço
    console.log("API: Verificando status do WhatsApp...");
    const status = await whatsappService.getStatus();

    if (!status.initialized) {
      console.log("API: Inicializando serviço do WhatsApp...");
      await whatsappService.initialize();
    }

    // Verificar autenticação após inicialização
    const updatedStatus = await whatsappService.getStatus();
    if (!updatedStatus.connected) {
      console.log("API: WhatsApp não autenticado");
      return NextResponse.json(
        {
          error: 'WhatsApp não autenticado',
          message: 'Escaneie o QR code para autenticar o WhatsApp'
        },
        { status: 400 }
      );
    }

    // Buscar configuração do WhatsApp
    console.log("API: Buscando configuração do WhatsApp...");
    const { data: configData, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'whatsapp_config')
      .single();

    if (configError) {
      console.error("API: Erro ao buscar configuração do WhatsApp:", configError);
      throw new Error(`Erro ao buscar configuração: ${configError.message}`);
    }

    const phoneNumber = configData?.value?.phoneNumber;
    if (!phoneNumber) {
      console.log("API: Número de telefone não configurado");
      return NextResponse.json(
        { error: 'WhatsApp não configurado. Configure um número primeiro.' },
        { status: 400 }
      );
    }

    // Buscar o pedido
    console.log(`API: Buscando pedido ID: ${orderId}...`);
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (username, full_name, email)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error("API: Erro ao buscar pedido:", orderError);
      throw new Error(`Erro ao buscar pedido: ${orderError.message}`);
    }

    if (!order) {
      console.log(`API: Pedido ID ${orderId} não encontrado`);
      return NextResponse.json(
        { error: `Pedido ID ${orderId} não encontrado` },
        { status: 404 }
      );
    }

    console.log("API: Pedido encontrado:", order);

    // Formatar os itens do pedido
    const items = order.items || [];
    const formattedItems = items.map((item: any) =>
      `• ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`
    ).join('\n');

    // Criar a mensagem
    const message =
      `🛒 *NOVO PEDIDO RECEBIDO!* 🛒\n\n` +
      `*Pedido:* #${orderId.substring(0, 8)}\n` +
      `*Data:* ${formatDate(order.created_at)}\n` +
      `*Cliente:* ${order.profiles?.full_name || order.profiles?.username || 'Não identificado'}\n` +
      `*Status:* ${order.status || 'Pendente'}\n` +
      `*Método de Pagamento:* ${formatPaymentMethod(order.payment_method)}\n` +
      `*Status do Pagamento:* ${order.payment_status || 'Pendente'}\n\n` +
      `*Itens do Pedido:*\n${formattedItems}\n\n` +
      `*Total:* ${formatCurrency(order.total_amount)}\n\n` +
      `Acesse o painel administrativo para mais detalhes.`;

    // Enviar mensagem real usando o serviço
    console.log(`API: Enviando notificação para ${phoneNumber}...`);
    const success = await whatsappService.sendMessage(phoneNumber, message);

    if (!success) {
      console.log("API: Falha ao enviar notificação");
      return NextResponse.json(
        { error: 'Erro ao enviar notificação' },
        { status: 500 }
      );
    }

    console.log("API: Notificação enviada com sucesso");

    return NextResponse.json({
      success: true,
      message: `Notificação do pedido ${orderId} enviada com sucesso`,
      phoneNumber
    });
  } catch (error: any) {
    console.error("API: Erro ao enviar notificação de pedido:", error);

    return NextResponse.json(
      {
        error: 'Erro ao enviar notificação de pedido',
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

// Funções auxiliares
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPaymentMethod(method: string) {
  switch (method?.toLowerCase()) {
    case 'credit_card': return 'Cartão de Crédito';
    case 'pix': return 'PIX';
    case 'boleto': return 'Boleto';
    default: return method || 'Desconhecido';
  }
}