"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export function useStripeProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchStripeProducts();
  }, []);

  const fetchStripeProducts = async () => {
    try {
      setLoading(true);
      const { data: stripeData, error } = await supabase.functions.invoke('get-stripe-products');
      if (error) throw error;

      const stripeProducts = stripeData?.map((product: any) => ({
        id: `stripe-${product.id}`,
        name: product.name,
        description: product.description || '',
        price: product.prices[0]?.unit_amount / 100 || 0,
        category: product.metadata?.category || 'Outros',
        media: [
          {
            type: 'image',
            url: product.images[0] || "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
            alt: product.name
          }
        ],
        features: product.metadata?.features?.split(',') || [] as string[],
        customization: product.metadata?.customization ? JSON.parse(product.metadata.customization) : undefined,
        stock: 999,
        status: 'active',
        stripeId: product.id
      })) || [];

      const defaultProducts = [
        {
          id: "camiseta-personalizada",
          name: "Camiseta Personalizada",
          price: 49.90,
          image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
          category: "Vestuário",
          description: "Camisetas 100% algodão com impressão DTF",
          media: [{
            type: 'image',
            url: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
            alt: "Camiseta Personalizada"
          }],
          features: [],
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
