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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || 'Outros',
        media: product.images?.map(url => ({
          type: 'image' as const,
          url,
          alt: product.name
        })) || [],
        features: product.features || [],
        customization: product.customization,
        stock: product.stock || 0,
        status: product.status as 'active' | 'draft' | 'archived',
        stripeId: product.stripe_id,
        low_stock_threshold: product.low_stock_threshold || 10
      }));

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
