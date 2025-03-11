import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { items, total, shippingAddress, paymentMethod } = await req.json();

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Failed to get user information');

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        items,
        total_amount: total,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Send confirmation email (implement your email service here)
    // For now, we'll just return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order created successfully',
        order
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
