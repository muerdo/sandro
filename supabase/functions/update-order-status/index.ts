import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, status, estimatedDelivery, trackingInfo } = await req.json()

    // Validate admin authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) throw new Error('Unauthorized')

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        estimated_delivery: estimatedDelivery,
        tracking_info: trackingInfo,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
