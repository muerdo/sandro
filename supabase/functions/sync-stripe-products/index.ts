import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

interface StripePrice {
  id: string
  unit_amount: number
  active: boolean
  currency: string
  metadata?: {
    default?: boolean
  }
}

interface StripeProduct {
  id: string
  name: string
  description: string | null
  active: boolean
  images: string[]
  metadata?: {
    category?: string
    features?: string
    customization?: string
    stock?: string
    low_stock_threshold?: string
  }
}

interface ProcessedProduct {
  id: string
  stripe_id: string
  name: string
  description: string
  price: number
  category: string
  images: string[]
  features: string[]
  customization: Record<string, unknown>
  stock: number
  status: 'active' | 'archived'
  stripe_price_id: string
  low_stock_threshold: number
  updated_at: string
}

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
    const { stripe, supabaseClient } = await initializeClients()

    const { processedProducts, errors } = await processStripeProducts(stripe, supabaseClient)

    if (processedProducts.length > 0) {
      await archiveOldProducts(supabaseClient, processedProducts, errors)
    }

    return createSuccessResponse(processedProducts.length, errors)
  } catch (error) {
    console.error('Error syncing products:', error)
    return createErrorResponse(error)
  }
})

async function initializeClients() {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    throw new Error('Missing Stripe secret key')
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey)

  return { stripe, supabaseClient }
}

async function processStripeProducts(stripe: Stripe, supabaseClient: ReturnType<typeof createClient>) {
  const processedProducts: string[] = []
  const errors: Array<{ productId: string; error: string }> = []

  const stripeProducts = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
    limit: 100
  })

  console.log(`Found ${stripeProducts.data.length} products in Stripe`)

  for (const stripeProduct of stripeProducts.data) {
    try {
      const product = await processProduct(stripe, stripeProduct)
      await upsertProduct(supabaseClient, product)
      processedProducts.push(product.id)
    } catch (error) {
      errors.push({
        productId: stripeProduct.id,
        error: error instanceof Error ? error.message : String(error)
      })
      console.error(`Error processing product ${stripeProduct.id}:`, error)
    }
  }

  return { processedProducts, errors }
}

async function processProduct(stripe: Stripe, stripeProduct: StripeProduct): Promise<ProcessedProduct> {
  const { data: prices } = await stripe.prices.list({
    product: stripeProduct.id,
    active: true,
    currency: 'brl'
  })

  const defaultPrice = findDefaultPrice(prices)
  if (!defaultPrice?.unit_amount) {
    throw new Error(`No valid price found for product ${stripeProduct.id}`)
  }

  const features = parseFeatures(stripeProduct.metadata?.features)
  const customization = parseCustomization(stripeProduct.metadata?.customization)

  return {
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
  }
}

function findDefaultPrice(prices: Array<{ metadata?: { default?: boolean }, unit_amount?: number }>) {
  return prices.find(price => price.metadata?.default) || 
         prices.reduce((lowest, current) => {
           if (!lowest || (current.unit_amount || 0) < (lowest.unit_amount || 0)) {
             return current
           }
           return lowest
         }, null as { unit_amount?: number } | null)
}

function parseFeatures(features?: string): string[] {
  return features?.split(',').map(f => f.trim()) || []
}

function parseCustomization(customization?: string): Record<string, unknown> {
  if (!customization) return {}
  try {
    return JSON.parse(customization)
  } catch (e) {
    console.error('Invalid customization JSON:', e)
    return {}
  }
}

async function upsertProduct(supabaseClient: ReturnType<typeof createClient>, product: ProcessedProduct) {
  const { error } = await supabaseClient
    .from('products')
    .upsert(product, {
      onConflict: 'stripe_id',
      ignoreDuplicates: false
    })

  if (error) throw error
}

async function archiveOldProducts(
  supabaseClient: ReturnType<typeof createClient>,
  processedProducts: string[],
  errors: Array<{ type?: string; error: string }>
) {
  const { error: archiveError } = await supabaseClient
    .from('products')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .filter('stripe_id', 'not.in', `(${processedProducts.map(id => id.replace('stripe-', '')).map(id => `'${id}'`).join(',')})`)
    .filter('status', 'eq', 'active')

  if (archiveError) {
    errors.push({
      type: 'archive',
      error: archiveError.message
    })
  }
}

function createSuccessResponse(processedCount: number, errors: Array<{ type?: string; error: string }>) {
  return new Response(
    JSON.stringify({
      success: true,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synchronized ${processedCount} products${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errors.length > 0 ? 207 : 200
    }
  )
}

function createErrorResponse(error: unknown) {
  return new Response(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    }
  )
}
