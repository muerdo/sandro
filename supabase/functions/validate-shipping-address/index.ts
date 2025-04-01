import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

interface WebhookResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: any;
}

interface AddressValidationResponse extends WebhookResponse {
  viaCepData?: any;
}

// Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Schema de validação
const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido"),
  address: z.string().min(5, "Endereço muito curto"),
  city: z.string().min(3, "Cidade inválida"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  postal_code: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  is_default: z.boolean().optional().default(false)
});

// Initialize Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// Utility Functions
const createResponse = (data: AddressValidationResponse, status: number = 200): Response => {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status
    }
  );
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createResponse(
        { success: false, error: 'Token de autenticação não fornecido' },
        401
      );
    }

    // Configurar cliente Supabase com token do usuário
    const userSupabaseClient = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_ANON_KEY ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userSupabaseClient.auth.getUser();
    if (!user || authError) {
      return createResponse(
        { success: false, error: 'Usuário não autenticado' },
        401
      );
    }

    // Validação do payload
    let addressData: z.infer<typeof AddressSchema>;
    try {
      addressData = AddressSchema.parse(await req.json());
    } catch (zodError) {
      return createResponse(
        { 
          success: false,
          error: 'Dados inválidos',
          details: zodError.errors 
        },
        422
      );
    }

    // Validação adicional do estado
    const { data: validState, error: stateError } = await supabaseClient
      .from('estados_brasileiros')
      .select('uf')
      .eq('uf', addressData.state)
      .single();

    if (stateError || !validState) {
      return createResponse(
        { success: false, error: 'Estado não encontrado' },
        400
      );
    }

    // Consulta ViaCEP
    const cepDigits = addressData.postal_code.replace(/\D/g, '');
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    const viaCepData = await viaCepResponse.json();

    if (viaCepData.erro) {
      return createResponse(
        { success: false, error: 'CEP não encontrado' },
        400
      );
    }

    // Preparar dados finais
    const finalData = {
      ...addressData,
      user_id: user.id,
      postal_code: cepDigits, // Armazena sem máscara
      updated_at: new Date().toISOString(),
      ...(!addressData.id && { 
        created_at: new Date().toISOString(),
        id: undefined // Remove ID para novos registros
      })
    };

    // Se for padrão, desmarca outros padrões
    if (finalData.is_default) {
      const { error: defaultError } = await userSupabaseClient
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', addressData.id || '');

      if (defaultError) throw defaultError;
    }

    return createResponse({
      success: true,
      data: finalData,
      viaCepData // Dados do CEP para possível autopreenchimento
    });

  } catch (error) {
    console.error('Error in address validation:', error);
    return createResponse(
      { 
        success: false,
        error: 'Erro interno no servidor',
        ...(error instanceof Error && { details: error.message })
      },
      500
    );
  }
}