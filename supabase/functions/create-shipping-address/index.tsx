import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import type { Database } from '../_shared/database.types';

interface ShippingAddressRequest {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Falha ao obter informações do usuário');
    }

    let body: ShippingAddressRequest;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Erro ao analisar o corpo da requisição:', error);
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição inválido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar campos obrigatórios
    if (!body.full_name || !body.email || !body.phone || !body.address || !body.city || !body.state || !body.postal_code) {
      throw new Error('Todos os campos são obrigatórios');
    }

    // Se is_default for true, atualizar outros endereços para false
    if (body.is_default) {
      await supabaseClient
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Inserir novo endereço
    const { data: shippingAddress, error: insertError } = await supabaseClient
      .from('shipping_addresses')
      .insert({
        user_id: user.id,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        postal_code: body.postal_code,
        is_default: body.is_default,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir endereço:', insertError);
      throw new Error('Falha ao criar endereço de entrega');
    }

    return new Response(
      JSON.stringify(shippingAddress),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
