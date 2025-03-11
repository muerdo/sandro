"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CatalogoPage() {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([
  {
    id: "camiseta-personalizada",
    name: "Camiseta Personalizada",
    price: 49.90,
    image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
    category: "Vestuário",
    description: "Camisetas 100% algodão com impressão DTF"
  },
  {
    id: "adesivo-personalizado",
    name: "Adesivo Personalizado",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2671&auto=format&fit=crop",
    category: "Adesivos",
    description: "Adesivos de alta qualidade em vinil"
  },
  {
    id: "banner-grande-formato",
    name: "Banner Grande Formato",
    price: 149.90,
    image: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop",
    category: "Impressão",
    description: "Banners em lona com acabamento profissional"
  },
  {
    id: "caneca-personalizada",
    name: "Caneca Personalizada",
    price: 39.90,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2670&auto=format&fit=crop",
    category: "Presentes",
    description: "Canecas de cerâmica com impressão sublimática"
  }
]);

export default function CatalogoPage() {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStripeProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('get-stripe-products');
        if (error) throw error;
        
        // Merge Stripe products with existing products
        const defaultProducts = [
          {
            id: "camiseta-personalizada",
            name: "Camiseta Personalizada",
            price: 49.90,
            image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
            category: "Vestuário",
            description: "Camisetas 100% algodão com impressão DTF"
          },
          {
            id: "adesivo-personalizado",
            name: "Adesivo Personalizado",
            price: 29.90,
            image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2671&auto=format&fit=crop",
            category: "Adesivos",
            description: "Adesivos de alta qualidade em vinil"
          },
          {
            id: "banner-grande-formato",
            name: "Banner Grande Formato",
            price: 149.90,
            image: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop",
            category: "Impressão",
            description: "Banners em lona com acabamento profissional"
          },
          {
            id: "caneca-personalizada",
            name: "Caneca Personalizada",
            price: 39.90,
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2670&auto=format&fit=crop",
            category: "Presentes",
            description: "Canecas de cerâmica com impressão sublimática"
          }
        ];

        const stripeProducts = data?.map((product: any) => ({
          ...product,
          id: `stripe-${product.id}`
        })) || [];

        setProducts([...defaultProducts, ...stripeProducts]);
      } catch (error) {
        console.error('Error fetching Stripe products:', error);
        toast.error('Failed to load some products');
      } finally {
        setLoading(false);
      }
    };

    fetchStripeProducts();
  }, []);

  const handleQuickAdd = (product: typeof products[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    href={`/produtos/${product.id.split('-')[0]}s`}
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
                    onClick={() => handleQuickAdd(product)}
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
