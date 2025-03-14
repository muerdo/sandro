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
          image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
          category: "Vestuário",
          description: "Camisetas 100% algodão com impressão DTF",
          media: [{
            type: 'image',
            url: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
            alt: "Camiseta Personalizada"
          }],
          features: [] as string[],
          status: 'active'
        },
        {
          id: "adesivo-personalizado",
          name: "Adesivo Personalizado",
          price: 29.90,
          image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2671&auto=format&fit=crop",
          category: "Adesivos",
          description: "Adesivos de alta qualidade em vinil",
          media: [{
            type: 'image',
            url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2671&auto=format&fit=crop",
            alt: "Adesivo Personalizado"
          }],
          features: [],
          status: 'active'
        }
      ];

      setProducts([...defaultProducts, ...stripeProducts]);
    } catch (error) {
      console.error('Error fetching Stripe products:', error);
      toast.error('Failed to load some products');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading };
}
