"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import abacatepay from "@/hooks/abacatepay";

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

export function useAbacatePayProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  const transformAbacatePayProduct = (product: any): Product => {
    return {
      id: `abacate-${product.id}`,
      name: product.name || 'Untitled Product',
      description: product.description || '',
      price: product.price || 0,
      category: product.category || 'Outros',
      image: product.image_url,
      media: product.images?.map((url: string) => ({
        type: 'image' as const,
        url,
        alt: product.name || 'Product Image'
      })) || [{
        type: 'image',
        url: product.image_url,
        alt: product.name || 'Product Image'
      }],
      features: product.features?.split(',') || [],
      customization: product.customization ? 
        JSON.parse(product.customization) : undefined,
      stock: product.stock ? parseInt(product.stock) : 999,
      status: 'active',
      abacateId: product.id,
      low_stock_threshold: product.low_stock_threshold ? 
        parseInt(product.low_stock_threshold) : 10
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Aqui você pode implementar a lógica para buscar produtos do AbacatePay
      // Por enquanto, vamos usar os produtos padrão
      
      // Simulando uma chamada de API
      setTimeout(() => {
        setProducts(DEFAULT_PRODUCTS);
        setLoading(false);
        toast.success('Produtos carregados com sucesso');
      }, 1000);
      
      // Quando a API do AbacatePay estiver disponível, você pode descomentar o código abaixo
      /*
      const { data: abacateProducts, error } = await supabase.functions.invoke('get-abacatepay-products', {
        body: { 
          limit: 100
        }
      });

      if (error) {
        console.error('Erro ao buscar produtos do AbacatePay:', error);
        toast.error('Falha ao carregar produtos');
        setProducts(DEFAULT_PRODUCTS);
        return;
      }

      if (Array.isArray(abacateProducts)) {
        const transformedProducts = abacateProducts
          .map(transformAbacatePayProduct)
          .filter(product => product !== null);
        
        setProducts([...DEFAULT_PRODUCTS, ...transformedProducts]);
        toast.success('Produtos carregados com sucesso');
      }
      */
    } catch (error) {
      console.error('Erro ao buscar produtos do AbacatePay:', error);
      toast.error('Falha ao carregar alguns produtos');
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading };
}
