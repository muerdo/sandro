import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Missing Stripe secret key');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Fetch all products from Stripe with prices and metadata
    const stripeProducts = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
      limit: 100
    });

    console.log(`Found ${stripeProducts.data.length} products in Stripe`);

    // Process each product
    const processedProducts = [];
    const errors = [];

    for (const stripeProduct of stripeProducts.data) {
      try {
        // Get all prices for the product
        const { data: prices } = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          currency: 'brl'
        });

        // Find default or lowest price
        const defaultPrice = prices.find(price => price.metadata?.default) || 
                           prices.reduce((lowest, current) => {
                             if (!lowest || current.unit_amount < lowest.unit_amount) {
                               return current;
                             }
                             return lowest;
                           }, null);

        if (!defaultPrice?.unit_amount) {
          throw new Error(`No valid price found for product ${stripeProduct.id}`);
        }

        // Parse features and customization from metadata
        const features = stripeProduct.metadata?.features?.split(',').map(f => f.trim()) || [];
        let customization = {};
        try {
          if (stripeProduct.metadata?.customization) {
            customization = JSON.parse(stripeProduct.metadata.customization);
          }
        } catch (e) {
          console.error(`Invalid customization JSON for product ${stripeProduct.id}`);
        }

        // Transform to database format
        const product = {
          id: `stripe-${stripeProduct.id}`,
          name: stripeProduct.name,
          description: stripeProduct.description || '',
          price: defaultPrice.unit_amount / 100,
          category: stripeProduct.metadata?.category || 'Outros',
          images: stripeProduct.images || [],
          features,
          customization,
          stock: parseInt(stripeProduct.metadata?.stock || '999'),
          status: stripeProduct.active ? 'active' : 'archived',
          stripe_id: stripeProduct.id,
          stripe_price_id: defaultPrice.id,
          low_stock_threshold: parseInt(stripeProduct.metadata?.low_stock_threshold || '10'),
          updated_at: new Date().toISOString()
        };

        // Upsert product
        const { error } = await supabaseClient
          .from('products')
          .upsert(product, {
            onConflict: 'stripe_id',
            ignoreDuplicates: false
          });

        if (error) throw error;
        processedProducts.push(product.id);

      } catch (error) {
        errors.push({
          productId: stripeProduct.id,
          error: error.message
        });
        console.error(`Error processing product ${stripeProduct.id}:`, error);
      }
    }

    // Archive products not in Stripe
    if (processedProducts.length > 0) {
      const { error: archiveError } = await supabaseClient
        .from('products')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .filter('stripe_id', 'not.in', `(${processedProducts.map(id => id.replace('stripe-', '')).map(id => `'${id}'`).join(',')})`)
        .filter('status', 'eq', 'active');

      if (archiveError) {
        errors.push({
          type: 'archive',
          error: archiveError.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedProducts.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Synchronized ${processedProducts.length} products${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errors.length > 0 ? 207 : 200
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
