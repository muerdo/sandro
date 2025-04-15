import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';
import axios from 'axios';

// Configuração do cliente Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// Configuração do cliente AbacatePay
const abacatePayClient = axios.create({
  baseURL: 'https://api.abacatepay.com/v1',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_KEY')}`,
    'Content-Type': 'application/json'
  }
});

// Função para verificar o status de um pagamento PIX
async function checkPixStatus(transactionId: string) {
  try {
    const response = await abacatePayClient.get(`/pixQrCode/check?id=${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar status do PIX:', error);
    throw error;
  }
}

// Função para verificar o status de uma cobrança
async function checkBillingStatus(billingId: string) {
  try {
    const response = await abacatePayClient.get(`/billing/status?id=${billingId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar status da cobrança:', error);
    throw error;
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
    // Obter parâmetros da URL
    const url = new URL(req.url);
    const transactionId = url.searchParams.get('transactionId');
    const billingId = url.searchParams.get('billingId');
    const orderId = url.searchParams.get('orderId');
    const type = url.searchParams.get('type') || 'pix';
    
    // Verificar se os parâmetros necessários foram fornecidos
    if ((!transactionId && !billingId) || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos. Forneça transactionId/billingId e orderId.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar o status do pagamento
    let statusResult;
    if (type === 'pix' && transactionId) {
      statusResult = await checkPixStatus(transactionId);
    } else if (billingId) {
      statusResult = await checkBillingStatus(billingId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de pagamento inválido ou ID não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Mapear o status do AbacatePay para o formato do sistema
    let orderStatus = 'pending';
    let paymentStatus = 'pending';
    
    if (statusResult.status === 'PAID' || statusResult.status === 'COMPLETED') {
      orderStatus = 'processing';
      paymentStatus = 'completed';
    } else if (statusResult.status === 'FAILED' || statusResult.status === 'CANCELLED') {
      orderStatus = 'cancelled';
      paymentStatus = 'failed';
    } else if (statusResult.status === 'PROCESSING') {
      orderStatus = 'pending';
      paymentStatus = 'processing';
    }
    
    // Atualizar o status do pedido no Supabase
    if (orderId && (paymentStatus !== 'pending' || req.method === 'POST')) {
      await updateOrderStatus(orderId, orderStatus, paymentStatus);
    }
    
    // Retornar o resultado
    return new Response(
      JSON.stringify({
        success: true,
        status: statusResult.status,
        orderStatus,
        paymentStatus,
        details: statusResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar status do pagamento', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
