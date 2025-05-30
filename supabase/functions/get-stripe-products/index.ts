import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import '../_shared/types';

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: {
    category?: string;
    features?: string;
    customization?: string;
  };
  default_price: Stripe.Price;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Busca os produtos ativos no Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Transforma os produtos do Stripe no formato esperado
    const formattedProducts = products.data.map((product: StripeProduct) => {
      const defaultPrice = product.default_price as Stripe.Price;
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: defaultPrice?.unit_amount ? defaultPrice.unit_amount / 100 : 0,
        image: product.images?.[0] || 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop',
        category: product.metadata?.category || 'Outros',
        features: product.metadata?.features ? 
          JSON.parse(product.metadata.features) : [],
        customization: product.metadata?.customization ? 
          JSON.parse(product.metadata.customization) : {},
      };
    });

    // Retorna os produtos formatados
    return new Response(
      JSON.stringify(formattedProducts),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});