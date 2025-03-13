"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useStripeProducts } from "@/hooks/useStripeProducts";
import ProductCard from "@/components/products/product-card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();

  const defaultProducts: Product[] = [
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
      stock: 100,
      status: 'active',
      low_stock_threshold: 10,
      stripeId: null
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
      stock: 100,
      status: 'active',
      low_stock_threshold: 10
    },
    {
      id: "banner-grande-formato",
      name: "Banner Grande Formato",
      price: 149.90,
      image: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop",
      category: "Impressão",
      description: "Banners em lona com acabamento profissional",
      media: [{
        type: 'image',
        url: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop",
        alt: "Banner Grande Formato"
      }],
      features: [],
      stock: 100,
      status: 'active',
      low_stock_threshold: 10
    },
    {
      id: "caneca-personalizada",
      name: "Caneca Personalizada",
      price: 39.90,
      image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2670&auto=format&fit=crop",
      category: "Presentes",
      description: "Canecas de cerâmica com impressão sublimática",
      media: [{
        type: 'image',
        url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2670&auto=format&fit=crop",
        alt: "Caneca Personalizada" 
      }],
      features: [],
      stock: 100,
      status: 'active',
      low_stock_threshold: 10
    }
  ];

  useEffect(() => {
    const fetchStripeProducts = async () => {
      try {
        setLoading(true);
        const { data: stripeData, error } = await supabase.functions.invoke('get-stripe-products');
        if (error) {
          console.error('Error fetching Stripe products:', error);
          toast.error('Failed to load Stripe products');
          setProducts(defaultProducts); // Fallback to default products
          return;
        }

        // Transform Stripe products to match our format
        const stripeProducts = Array.isArray(stripeData) ? stripeData.map((product: any) => {
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
            console.error(`No valid price found for product ${product.id}`);
            return null;
          }

          return {
            id: `stripe-${product.id}`,
            name: product.name || 'Untitled Product',
            description: product.description || '',
            price: defaultPrice.unit_amount / 100,
            category: product.metadata?.category || 'Outros',
            image: product.images?.[0] || "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
            media: [
              {
                type: 'image' as const,
                url: product.images?.[0] || "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
                alt: product.name || 'Product Image'
              }
            ],
            features: product.metadata?.features?.split(',') || [],
            customization: product.metadata?.customization ? JSON.parse(product.metadata.customization) : undefined,
            stock: 999,
            status: 'active' as const,
            stripeId: product.id,
            low_stock_threshold: 10
          };
        }).filter(Boolean) : [];

        const allProducts = [...defaultProducts];
        if (stripeProducts.length > 0) {
          allProducts.push(...stripeProducts);
        }

        setProducts(allProducts);
        toast.success('Products loaded successfully');
      } catch (error) {
        console.error('Error fetching Stripe products:', error);
        toast.error('Failed to load some products');
      } finally {
        setLoading(false);
      }
    };

    fetchStripeProducts();
  }, []);


  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => window.location.href = '/servicos'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Serviços
        </motion.button>

        <h1 className="text-4xl font-bold mb-8">Nossos Produtos</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading && (
            <div className="col-span-full flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          )}
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative aspect-square">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/80 text-sm">{product.category}</p>
                  <h3 className="text-white font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-white/90 font-bold">
                    R$ {product.price.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <p className="text-muted-foreground">{product.description}</p>
                
                <div className="flex gap-3">
                  <Link
                    href={product.stripeId 
                      ? `/produtos/stripe/product?id=${product.stripeId}` 
                      : `/produtos/${product.id.split('-')[0]}s`}
                    className="flex-1"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-medium"
                    >
                      Ver Detalhes
                    </motion.button>
                  </Link>
                  
                  <motion.button
                    onClick={() => {
                      if (!user) {
                        setShowAuthDialog(true);
                        return;
                      }
                      addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.media?.[0]?.url || ''
                      });
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-primary text-primary-foreground p-2 rounded-lg"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
