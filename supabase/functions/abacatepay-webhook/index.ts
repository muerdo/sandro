import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';
import * as crypto from 'crypto';

// Configuração do cliente Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// Função para verificar a assinatura do webhook
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Erro ao verificar assinatura do webhook:', error);
    return false;
  }
}

// Função para atualizar o status de um pedido no Supabase
async function updateOrderStatus(orderId: string, status: string, paymentStatus: string) {
  try {
    const { error } = await supabaseClient
      .from('orders')
      .update({
        status,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    throw error;
  }
}

// Handler para requisições HTTP
Deno.serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter a assinatura do cabeçalho
    const signature = req.headers.get('x-abacatepay-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não fornecida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter o corpo da requisição
    const payload = await req.text();
    const webhookSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET') ?? '';
    
    // Verificar a assinatura
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return new Response(
        JSON.stringify({ error: 'Assinatura inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Processar o evento
    const event = JSON.parse(payload);
    console.log('Evento recebido:', event);
    
    // Verificar o tipo de evento
    switch (event.type) {
      case 'payment.succeeded':
        // Atualizar o status do pedido para pago
        await updateOrderStatus(
          event.data.order_id,
          'processing',
          'completed'
        );
        break;
      case 'payment.failed':
        // Atualizar o status do pedido para falha
        await updateOrderStatus(
          event.data.order_id,
          'cancelled',
          'failed'
        );
        break;
      case 'payment.processing':
        // Atualizar o status do pedido para processando
        await updateOrderStatus(
          event.data.order_id,
          'pending',
          'processing'
        );
        break;
      default:
        console.log(`Evento não processado: ${event.type}`);
    }
    
    // Retornar sucesso
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar webhook', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
