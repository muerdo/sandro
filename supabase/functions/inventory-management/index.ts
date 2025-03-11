import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Verify admin status
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Failed to get user information')
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Unauthorized access')
    }

    const { action, productId, newStock, lowStockThreshold, notes } = await req.json()

    switch (action) {
      case 'update_stock': {
        const { data: product } = await supabaseClient
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single()

        const previousStock = product?.stock ?? 0

        // Update product stock
        const { error: updateError } = await supabaseClient
          .from('products')
          .update({ 
            stock: newStock,
            low_stock_threshold: lowStockThreshold,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)

        if (updateError) throw updateError

        // Record stock change in history
        const { error: historyError } = await supabaseClient
          .from('inventory_history')
          .insert({
            product_id: productId,
            previous_stock: previousStock,
            new_stock: newStock,
            change_amount: newStock - previousStock,
            change_type: 'manual',
            notes,
            created_by: user.id
          })

        if (historyError) throw historyError

        // Check if we need to create alerts
        if (newStock <= lowStockThreshold) {
          await supabaseClient
            .from('inventory_alerts')
            .insert({
              product_id: productId,
              alert_type: newStock === 0 ? 'out_of_stock' : 'low_stock'
            })
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_history': {
        const { data: history, error: historyError } = await supabaseClient
          .from('inventory_history')
          .select(`
            *,
            products (name),
            profiles (username)
          `)
          .eq('product_id', productId)
          .order('created_at', { ascending: false })

        if (historyError) throw historyError

        return new Response(
          JSON.stringify({ history }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
