"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product } from "@/types/product";

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "camiseta-personalizada",
    name: "Camiseta Personalizada",
    price: 49.90,
    image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
    category: "Vestuário",
    description: "Camisetas 100% algodão com impressão DTF",
    media: [{
      type: 'image',
      url: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
      alt: "Camiseta Personalizada"
    }],
    features: [],
    stock: 100,
    status: 'active',
    low_stock_threshold: 10
  },
  {
    id: "adesivo-personalizado",
    name: "Adesivo Personalizado",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d",
    category: "Adesivos",
    description: "Adesivos de alta qualidade em vinil",
    media: [{
      type: 'image',
      url: "https://images.unsplash.com/photo-1626785774573-4b799315345d",
      alt: "Adesivo Personalizado"
    }],
    features: [],
    stock: 100,
    status: 'active',
    low_stock_threshold: 10
  }
];

export function useStripeProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  const transformStripeProduct = (product: any): Product => {
    return {
      id: `stripe-${product.id}`,
      name: product.name || 'Untitled Product',
      description: product.description || '',
      price: product.prices?.[0]?.unit_amount ? product.prices[0].unit_amount / 100 : 0,
      category: product.metadata?.category || 'Outros',
      image: product.images?.[0],
      media: product.images?.map((url: string) => ({
        type: 'image' as const,
        url,
        alt: product.name || 'Product Image'
      })) || [],
      features: product.metadata?.features?.split(',') || [],
      customization: product.metadata?.customization ? 
        JSON.parse(product.metadata.customization) : undefined,
      stock: product.metadata?.stock ? parseInt(product.metadata.stock) : 999,
      status: 'active',
      stripeId: product.id,
      low_stock_threshold: product.metadata?.low_stock_threshold ? 
        parseInt(product.metadata.low_stock_threshold) : 10
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: stripeData, error } = await supabase.functions.invoke('get-stripe-products', {
        body: { 
          limit: 100,
          sessionToken: session?.access_token 
        }
      });

      if (error) {
        console.error('Error fetching Stripe products:', error);
        toast.error('Failed to load Stripe products');
        setProducts(DEFAULT_PRODUCTS);
        return;
      }

      // Log raw response for debugging
      console.log('Raw Stripe products response:', stripeData);

      if (Array.isArray(stripeData)) {
        const transformedProducts = stripeData
          .map(product => {
            // Get all active prices
            const activePrices = product.prices?.filter((price: any) => price.active) || [];
            
            // Find default price or lowest price
            const defaultPrice = activePrices.find((price: any) => price.metadata?.default) || 
                               activePrices.reduce((lowest: any, current: any) => {
                                 if (!lowest || current.unit_amount < lowest.unit_amount) {
                                   return current;
                                 }
                                 return lowest;
                               }, null);

            // Skip products without valid prices
            if (!defaultPrice?.unit_amount) {
              console.warn(`No valid price found for product ${product.id}`);
              return null;
            }

            return {
              id: `stripe-${product.id}`,
              name: product.name || 'Untitled Product',
              description: product.description || '',
              price: defaultPrice.unit_amount / 100,
              category: product.metadata?.category || 'Outros',
              image: product.images?.[0] || "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
              media: product.images?.map((url: string) => ({
                type: 'image' as const,
                url,
                alt: product.name || 'Product Image'
              })) || [],
              features: product.metadata?.features?.split(',').map((f: string) => f.trim()) || [],
              customization: product.metadata?.customization ? 
                JSON.parse(product.metadata.customization) : undefined,
              stock: product.metadata?.stock ? parseInt(product.metadata.stock) : 999,
              status: 'active' as const,
              stripeId: product.id,
              low_stock_threshold: product.metadata?.low_stock_threshold ? 
                parseInt(product.metadata.low_stock_threshold) : 10
            };
          })
          .filter((product): product is Product => {
            if (!product) return false;
            const transformedProduct = product as Partial<Product>;
            return typeof transformedProduct.image === 'string' || 
                   (Array.isArray(transformedProduct.media) && transformedProduct.media.length > 0);
          });
        
        setProducts([...DEFAULT_PRODUCTS, ...transformedProducts]);
        toast.success('Products loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching Stripe products:', error);
      toast.error('Failed to load some products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading };
}
