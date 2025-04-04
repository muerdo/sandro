// Supabase Edge Function para receber webhooks de pagamento PIX
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    [key: string]: any;
  };
  [key: string]: any;
}

serve(async (req) => {
  // Configurar cliente Supabase com as credenciais de serviço
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || '';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Verificar método HTTP
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
      },
    });
  }
  
  // Processar apenas requisições POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Método não permitido',
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  try {
    // Verificar secret do webhook para segurança
    const requestSecret = req.headers.get('X-Webhook-Secret');
    if (webhookSecret && requestSecret !== webhookSecret) {
      throw new Error('Secret inválido');
    }
    
    // Extrair corpo da requisição
    const payload = await req.json() as WebhookPayload;
    
    // Registrar o webhook recebido
    console.log('Webhook recebido:', JSON.stringify(payload));
    
    // Verificar se é um evento de pagamento
    if (!payload.event || !payload.data || !payload.data.id) {
      throw new Error('Payload inválido');
    }
    
    // Processar com base no tipo de evento
    if (payload.event === 'payment.updated' || payload.event === 'payment.created') {
      const transactionId = payload.data.id;
      const status = payload.data.status.toUpperCase();
      
      // Chamar a Edge Function de status do PIX para atualizar o banco de dados
      const pixStatusUrl = `${supabaseUrl}/functions/v1/pix-payment-status`;
      const response = await fetch(pixStatusUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          transactionId,
          action: 'update',
          status,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao atualizar status: ${errorData.message}`);
      }
      
      // Registrar o webhook no banco de dados para auditoria
      const { error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          event_type: payload.event,
          payload: payload,
          processed_at: new Date().toISOString(),
          status: 'processed',
        });
      
      if (logError) {
        console.error('Erro ao registrar webhook:', logError);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook processado com sucesso',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Evento não reconhecido
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Evento ignorado',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Registrar erro no console
    console.error('Erro ao processar webhook:', errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
