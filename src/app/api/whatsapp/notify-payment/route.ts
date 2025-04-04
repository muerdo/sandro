import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar configuração do WhatsApp
    const { data: configData, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'whatsapp_config')
      .single();
    
    if (configError) throw configError;
    
    const phoneNumber = configData?.value?.phoneNumber;
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'WhatsApp não configurado. Configure um número primeiro.' },
        { status: 400 }
      );
    }
    
    // Buscar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (username, full_name)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) throw orderError;
    
    // Formatar os itens do pedido
    const items = order.items || [];
    const formattedItems = items.map((item: any) => 
      `• ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`
    ).join('\n');
    
    // Criar a mensagem
    const message = 
      `🛒 *NOVO PEDIDO RECEBIDO!* 🛒\n\n` +
      `*Pedido:* #${order.id.slice(0, 8)}\n` +
      `*Data:* ${formatDate(order.created_at)}\n` +
      `*Cliente:* ${order.profiles?.full_name || order.profiles?.username || 'Não identificado'}\n` +
      `*Status:* ${order.status}\n` +
      `*Método de Pagamento:* ${formatPaymentMethod(order.payment_method)}\n` +
      `*Status do Pagamento:* ${order.payment_status}\n\n` +
      `*Itens do Pedido:*\n${formattedItems}\n\n` +
      `*Total:* ${formatCurrency(order.total_amount)}\n\n` +
      `Acesse o painel administrativo para mais detalhes.`;
    
    // Simular envio de mensagem (log)
    console.log('\n========== SIMULAÇÃO DE ENVIO DE WHATSAPP ==========');
    console.log(`Número: ${phoneNumber.replace(/\D/g, '')}`);
    console.log('Mensagem:');
    console.log(message);
    console.log('====================================================\n');
    
    console.log(`Mensagem simulada enviada com sucesso para ${phoneNumber}`);
    
    return NextResponse.json({
      success: true,
      message: `Notificação do pedido ${orderId} enviada com sucesso`
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação de pedido' },
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