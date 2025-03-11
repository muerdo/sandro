import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

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
    if (authError || !user) throw new Error('Failed to get user information')

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Update order status and notify user via email
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status,
        estimated_delivery: estimatedDelivery,
        tracking_info: {
          ...trackingInfo,
          last_updated: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('user_id')
      .single()

    if (updateError) throw updateError

    // Get user email for notification
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user email:', userError)
    } else if (userData?.email) {
      // Here you would integrate with your email service
      console.log(`Sending email to ${userData.email} about order ${orderId} status update`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Order status updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error updating order status:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
