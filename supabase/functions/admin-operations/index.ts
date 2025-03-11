import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get admin user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) throw new Error('Failed to get user information')

    // Verify admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    const { action, ...data } = await req.json()

    let result

    switch (action) {
      case 'verifyEmail':
        result = await supabaseClient
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', data.userId)
        break

      case 'updateProduct':
        result = await supabaseClient
          .from('products')
          .update(data.product)
          .eq('id', data.productId)
        break

      case 'deleteProduct':
        result = await supabaseClient
          .from('products')
          .delete()
          .eq('id', data.productId)
        break

      case 'createProduct':
        result = await supabaseClient
          .from('products')
          .insert(data.product)
        break

      case 'sendMessage':
        result = await supabaseClient
          .from('admin_messages')
          .insert({
            user_id: data.userId,
            admin_id: user.id,
            message: data.message,
            channel: data.channel
          })
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
