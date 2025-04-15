import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';
import { z } from 'zod';
import axios from 'axios';

// Esquema de validação para o corpo da requisição
const PaymentRequestSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['pix', 'card', 'boleto']),
  description: z.string().optional(),
  customer_id: z.string().optional(),
  order_id: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

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

// Função para criar um QR Code PIX
async function createPixQRCode(data: {
  amount: number;
  description?: string;
  expiresIn?: number;
  metadata?: Record<string, string>;
}) {
  try {
    const response = await abacatePayClient.post('/pixQrCode/create', {
      amount: data.amount,
      description: data.description || 'Compra na Sandro Adesivos',
      expiresIn: data.expiresIn || 30, // 30 minutos por padrão
      metadata: data.metadata || {}
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar QR Code PIX:', error);
    throw error;
  }
}

// Função para criar uma cobrança de cartão
async function createCardPayment(data: {
  amount: number;
  description?: string;
  customer_id?: string;
  order_id?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const response = await abacatePayClient.post('/billing/create', {
      amount: data.amount,
      description: data.description || 'Compra na Sandro Adesivos',
      payment_method: 'card',
      customer_id: data.customer_id,
      order_id: data.order_id,
      metadata: data.metadata || {}
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cobrança de cartão:', error);
    throw error;
  }
}

// Função para criar uma cobrança de boleto
async function createBoletoPayment(data: {
  amount: number;
  description?: string;
  customer_id?: string;
  order_id?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const response = await abacatePayClient.post('/billing/create', {
      amount: data.amount,
      description: data.description || 'Compra na Sandro Adesivos',
      payment_method: 'boleto',
      customer_id: data.customer_id,
      order_id: data.order_id,
      metadata: data.metadata || {}
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cobrança de boleto:', error);
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
    
    // Obter e validar o corpo da requisição
    const body = await req.json();
    const validationResult = PaymentRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = validationResult.data;
    
    // Processar o pagamento de acordo com o tipo
    let result;
    switch (data.type) {
      case 'pix':
        result = await createPixQRCode({
          amount: data.amount,
          description: data.description,
          metadata: data.metadata
        });
        break;
      case 'card':
        result = await createCardPayment({
          amount: data.amount,
          description: data.description,
          customer_id: data.customer_id,
          order_id: data.order_id,
          metadata: data.metadata
        });
        break;
      case 'boleto':
        result = await createBoletoPayment({
          amount: data.amount,
          description: data.description,
          customer_id: data.customer_id,
          order_id: data.order_id,
          metadata: data.metadata
        });
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de pagamento não suportado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    // Retornar o resultado
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro ao processar pagamento', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
