import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all active products from Stripe with their prices
    const stripeProducts = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    // Process each product
    for (const stripeProduct of stripeProducts.data) {
      const defaultPrice = stripeProduct.default_price as Stripe.Price;
      
      if (!defaultPrice?.unit_amount) {
        console.error(`No valid price found for product ${stripeProduct.id}`);
        continue;
      }

      // Transform Stripe product to our database format
      const product = {
        name: stripeProduct.name,
        description: stripeProduct.description || '',
        price: defaultPrice.unit_amount / 100,
        category: stripeProduct.metadata?.category || 'Outros',
        images: stripeProduct.images || [],
        features: stripeProduct.metadata?.features?.split(',').map(f => f.trim()) || [],
        customization: stripeProduct.metadata?.customization ? 
          JSON.parse(stripeProduct.metadata.customization) : {},
        stock: parseInt(stripeProduct.metadata?.stock || '999'),
        status: stripeProduct.active ? 'active' : 'archived',
        stripe_id: stripeProduct.id,
        low_stock_threshold: parseInt(stripeProduct.metadata?.low_stock_threshold || '10'),
        updated_at: new Date().toISOString()
      };

      // Upsert product in database
      const { error } = await supabaseClient
        .from('products')
        .upsert({
          ...product,
          id: `stripe-${stripeProduct.id}` // Ensure consistent ID format
        }, {
          onConflict: 'stripe_id'
        });

      if (error) {
        console.error(`Error upserting product ${stripeProduct.id}:`, error);
      }
    }

    // Mark products not in Stripe as archived
    const stripeProductIds = stripeProducts.data.map(p => p.id);
    const { error: archiveError } = await supabaseClient
      .from('products')
      .update({ status: 'archived' })
      .filter('stripe_id', 'not.in', `(${stripeProductIds.map(id => `'${id}'`).join(',')})`)
      .filter('status', 'eq', 'active');

    if (archiveError) {
      console.error('Error archiving old products:', archiveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronized ${stripeProducts.data.length} products`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error syncing products:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
