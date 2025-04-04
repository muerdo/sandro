// Supabase Edge Function para lidar com pagamentos PIX
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface PixPaymentRequest {
  transactionId: string;
  action?: 'check' | 'update';
  status?: string;
}

interface PixPaymentResponse {
  success: boolean;
  status: string;
  message: string;
  data?: any;
}

// Função para simular a verificação do status do PIX em um serviço externo
async function checkPixStatusExternal(transactionId: string): Promise<string> {
  // Em um ambiente real, aqui você faria uma chamada para a API do seu provedor de pagamento
  // Por exemplo: MercadoPago, PagSeguro, etc.
  
  // Para fins de demonstração, vamos simular uma resposta com base no ID da transação
  // Em um ambiente real, você substituiria isso pela lógica real de verificação
  
  // Simulação: transações que terminam com números pares são pagas, ímpares são pendentes
  const lastChar = transactionId.slice(-1);
  const lastDigit = parseInt(lastChar, 16);
  
  // Simulação de atraso na resposta da API externa (200-800ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 600));
  
  if (isNaN(lastDigit)) {
    return 'PENDING'; // Valor padrão para caracteres não numéricos
  }
  
  if (lastDigit % 2 === 0) {
    return 'PAID';
  } else {
    return 'PENDING';
  }
}

// Função principal que será executada quando a Edge Function for chamada
serve(async (req) => {
  // Configurar cliente Supabase com as credenciais de serviço
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Verificar método HTTP
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  // Processar apenas requisições POST e GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Método não permitido',
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
  
  try {
    let pixRequest: PixPaymentRequest;
    
    if (req.method === 'GET') {
      // Extrair parâmetros da URL para requisições GET
      const url = new URL(req.url);
      const transactionId = url.searchParams.get('transactionId');
      const action = url.searchParams.get('action') as 'check' | 'update' | undefined;
      
      if (!transactionId) {
        throw new Error('ID da transação é obrigatório');
      }
      
      pixRequest = {
        transactionId,
        action: action || 'check',
      };
    } else {
      // Extrair corpo da requisição para requisições POST
      const requestData = await req.json();
      pixRequest = requestData as PixPaymentRequest;
      
      if (!pixRequest.transactionId) {
        throw new Error('ID da transação é obrigatório');
      }
    }
    
    // Verificar se a transação existe no banco de dados
    const { data: pixTransaction, error: pixError } = await supabase
      .from('pending_checkouts')
      .select('*')
      .eq('pix_transaction_id', pixRequest.transactionId)
      .single();
    
    if (pixError && pixError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar transação: ${pixError.message}`);
    }
    
    // Verificar também na tabela de pedidos
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', pixRequest.transactionId)
      .single();
    
    if (orderError && orderError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar pedido: ${orderError.message}`);
    }
    
    // Se a ação for 'update', atualizar o status com o valor fornecido
    if (pixRequest.action === 'update' && pixRequest.status) {
      // Atualizar status na tabela pending_checkouts
      if (pixTransaction) {
        const { error: updateError } = await supabase
          .from('pending_checkouts')
          .update({
            status: pixRequest.status,
            updated_at: new Date().toISOString(),
            notes: `${new Date().toLocaleString()}: Status atualizado para ${pixRequest.status} via Edge Function.`
          })
          .eq('pix_transaction_id', pixRequest.transactionId);
        
        if (updateError) {
          throw new Error(`Erro ao atualizar checkout pendente: ${updateError.message}`);
        }
      }
      
      // Atualizar status na tabela orders
      if (orderData) {
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({
            payment_status: pixRequest.status === 'PAID' ? 'paid' : 'pending',
            status: pixRequest.status === 'PAID' ? 'processing' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', pixRequest.transactionId);
        
        if (updateOrderError) {
          throw new Error(`Erro ao atualizar pedido: ${updateOrderError.message}`);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          status: pixRequest.status,
          message: 'Status atualizado com sucesso',
          data: { pixTransaction, orderData }
        } as PixPaymentResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Se a ação for 'check' ou não for especificada, verificar o status atual
    const currentStatus = await checkPixStatusExternal(pixRequest.transactionId);
    
    // Se o status for 'PAID', atualizar o banco de dados
    if (currentStatus === 'PAID') {
      // Atualizar status na tabela pending_checkouts
      if (pixTransaction && pixTransaction.status !== 'paid') {
        const { error: updateError } = await supabase
          .from('pending_checkouts')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
            notes: `${new Date().toLocaleString()}: Pagamento confirmado via Edge Function.`
          })
          .eq('pix_transaction_id', pixRequest.transactionId);
        
        if (updateError) {
          console.error('Erro ao atualizar checkout pendente:', updateError);
          // Continuar mesmo com erro
        }
      }
      
      // Atualizar status na tabela orders
      if (orderData && orderData.payment_status !== 'paid') {
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', pixRequest.transactionId);
        
        if (updateOrderError) {
          console.error('Erro ao atualizar pedido:', updateOrderError);
          // Continuar mesmo com erro
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        status: currentStatus,
        message: 'Status verificado com sucesso',
        data: { pixTransaction, orderData }
      } as PixPaymentResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({
        success: false,
        status: 'ERROR',
        message: errorMessage,
      } as PixPaymentResponse),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
