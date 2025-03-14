"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export function useStripeProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const transformDatabaseProduct = (product: any): Product => {
    const customization = product.customization ? {
      sizes: product.customization.sizes || [],
      colors: product.customization.colors || [],
      types: product.customization.types || []
    } : undefined;

    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || 'Outros',
      media: product.images?.map((url: string) => ({
        type: 'image' as const,
        url,
        alt: product.name
      })) || [],
      features: product.features || [],
      customization,
      stock: product.stock || 0,
      status: product.status as 'active' | 'draft' | 'archived',
      stripeId: product.stripe_id,
      low_stock_threshold: product.low_stock_threshold || 10
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts = (data || [])
        .map(transformDatabaseProduct)
        .filter((product): product is Product => Boolean(product));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching Stripe products:', error);
      toast.error('Failed to load some products');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading };
}
