"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import ProductCard from "@/components/products/product-card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Product } from "@/types/product";
// Forçar revalidação da página para garantir que as alterações sejam refletidas
export const dynamic = 'force-dynamic';

// Nota: Metadados são definidos em um arquivo separado para componentes Server

export default function CatalogoPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();

  const defaultProducts: Product[] = [
    {
      id: "camiseta-personalizada",
      name: "Camiseta Personalizada",
      price: 49.9,
      image: "/img/camisetass.jpeg",
      category: "Vestuário",
      description: "Camisetas 100% algodão com impressão DTF",
      media: [
        {
          type: "image",
          url: "/img/camisetass.jpeg",
          alt: "Camiseta Personalizada",
        },
      ],
      features: [],
      stock: 100,
      status: "active",
      low_stock_threshold: 10,
      stripeId: null,
    },
    {
      id: "adesivo-personalizado",
      name: "Adesivo Personalizado",
      price: 25.,
      image: "/img/add.jpeg",
      category: "Adesivos",
      description: "Adesivos de alta qualidade em vinil",
      media: [
        {
          type: "image",
          url: "/img/add.jpeg",
          alt: "Adesivo Personalizado",
        },
      ],
      features: [],
      stock: 100,
      status: "active",
      low_stock_threshold: 10,
    },
    {
      id: "banner-grande-formato",
      name: "Banner Grande Formato",
      price: 149.9,
      image: "/img/ads.jpeg",
      category: "Impressão",
      description: "Banners em lona com acabamento profissional",
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop",
          alt: "Banner Grande Formato",
        },
      ],
      features: [],
      stock: 100,
      status: "active",
      low_stock_threshold: 10,
    },
    {
      id: "caneca-personalizada",
      name: "Caneca Personalizada",
      price: 39.9,
      image: "/img/canecas.png",
      category: "Presentes",
      description: "Canecas de cerâmica com impressão sublimática",
      media: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2670&auto=format&fit=crop",
          alt: "Caneca Personalizada",
        },
      ],
      features: [],
      stock: 100,
      status: "active",
      low_stock_threshold: 10,
    },
  ];

  // Função para mapear produtos do Supabase para o formato esperado
  const mapSupabaseProducts = (products) => {
    return products.map(product => {
      // Verifica se o produto tem imagens
      let productMedia = [];

      // Se o produto tem um array de imagens
      if (Array.isArray(product.images) && product.images.length > 0) {
        productMedia = product.images.map(url => ({
          type: 'image',
          url,
          alt: product.name
        }));
      }
      // Se o produto tem uma imagem única
      else if (product.image) {
        productMedia = [{
          type: 'image',
          url: product.image,
          alt: product.name
        }];
      }
      // Imagem padrão se não houver nenhuma
      else {
        productMedia = [{
          type: 'image',
          url: '/img/placeholder-product.jpg',
          alt: product.name
        }];
      }

      // Processa as features
      let features = [];
      if (Array.isArray(product.features)) {
        features = product.features;
      } else if (typeof product.features === 'string') {
        try {
          features = JSON.parse(product.features);
        } catch {
          features = product.features.split(',').map(f => f.trim());
        }
      }

      // Retorna o produto mapeado
      return {
        id: product.id,
        name: product.name || "Produto sem nome",
        description: product.description || "",
        price: typeof product.price === 'number' ? product.price : 0,
        category: product.category || "Outros",
        image: productMedia[0]?.url || "/img/placeholder-product.jpg",
        media: productMedia,
        features: features,
        stock: product.stock || 999,
        status: product.status || "active",
        stripeId: null,
        low_stock_threshold: product.low_stock_threshold || 10,
      };
    });
  };

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);

        // 1. Primeiro, buscar produtos do Supabase
        console.log('Fetching products from Supabase...');
        const { data: supabaseProducts, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.error("Error fetching Supabase products:", supabaseError);
          toast.error("Failed to load products from database");
        } else {
          console.log(`Fetched ${supabaseProducts?.length || 0} products from Supabase`);
        }

        // 2. Depois, buscar produtos do Stripe
        const { data: { session } } = await supabase.auth.getSession();

        // Adiciona o token de sessão para autorização
        const { data: stripeData, error } = await supabase.functions.invoke("get-stripe-products", {
          body: {
            sessionToken: session?.access_token
          }
        });

        if (error) {
          console.error("Error fetching Stripe products:", error);
          toast.error("Failed to load Stripe products");

          // Se temos produtos do Supabase, usamos eles + os produtos padrão
          if (supabaseProducts && supabaseProducts.length > 0) {
            const mappedSupabaseProducts = mapSupabaseProducts(supabaseProducts);
            setProducts([...defaultProducts, ...mappedSupabaseProducts]);
          } else {
            setProducts(defaultProducts); // Fallback to default products
          }
          return;
        }

        // Log para debug
        console.log("Raw Stripe products data:", stripeData);

        // Transform Stripe products to match our format
        const stripeProducts = Array.isArray(stripeData)
          ? stripeData
              .map((product: any) => {
                // Verifica se o produto tem os dados necessários
                if (!product || !product.id) {
                  console.warn("Invalid product data:", product);
                  return null;
                }

                // Determina o preço do produto
                let productPrice = 0;

                // Se o produto já tem um preço definido, use-o
                if (typeof product.price === 'number') {
                  productPrice = product.price;
                }
                // Caso contrário, tente extrair o preço dos preços disponíveis
                else if (Array.isArray(product.prices) && product.prices.length > 0) {
                  // Get all active prices
                  const activePrices = product.prices.filter((price: any) => price.active) || [];

                  // Find default price or lowest price
                  const defaultPrice =
                    activePrices.find((price: any) => price.metadata?.default) ||
                    activePrices.reduce((lowest: any, current: any) => {
                      if (!lowest || current.unit_amount < lowest.unit_amount) {
                        return current;
                      }
                      return lowest;
                    }, null);

                  if (defaultPrice?.unit_amount) {
                    productPrice = defaultPrice.unit_amount / 100;
                  }
                }

                // Imagem padrão caso não haja imagem
                const defaultImage = "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9";
                const productImage = product.image || (product.images && product.images[0]) || defaultImage;

                return {
                  id: `stripe-${product.id}`,
                  name: product.name || "Untitled Product",
                  description: product.description || "",
                  price: productPrice,
                  category: product.metadata?.category || product.category || "Outros",
                  image: productImage,
                  media: [
                    {
                      type: "image" as const,
                      url: productImage,
                      alt: product.name || "Product Image",
                    },
                  ],
                  features: product.features ||
                           (product.metadata?.features ?
                             (typeof product.metadata.features === 'string' ?
                               product.metadata.features.split(",").map((f: string) => f.trim()) :
                               product.metadata.features) :
                             []),
                  customization: product.customization ||
                                (product.metadata?.customization ?
                                  (typeof product.metadata.customization === 'string' ?
                                    JSON.parse(product.metadata.customization) :
                                    product.metadata.customization) :
                                  undefined),
                  stock: product.stock || 999,
                  status: "active" as const,
                  stripeId: product.id,
                  low_stock_threshold: product.low_stock_threshold || 10,
                };
              })
              .filter(Boolean)
          : [];

        console.log("Transformed Stripe products:", stripeProducts);

        // Combinar todos os produtos
        let allProducts = [...defaultProducts];

        // Adicionar produtos do Supabase se existirem
        if (supabaseProducts && supabaseProducts.length > 0) {
          const mappedSupabaseProducts = mapSupabaseProducts(supabaseProducts);
          console.log(`Mapped ${mappedSupabaseProducts.length} Supabase products`);
          allProducts = [...allProducts, ...mappedSupabaseProducts];
        }

        // Adicionar produtos do Stripe se existirem
        if (stripeProducts.length > 0) {
          allProducts = [...allProducts, ...stripeProducts];
        }

        console.log(`Total products: ${allProducts.length}`);
        setProducts(allProducts);
        toast.success("Products loaded successfully");
      } catch (error) {
        console.error("Error fetching Stripe products:", error);
        toast.error("Failed to load some products");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Schema.org para SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "image": product.image,
        "description": product.description,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "Sandro Adesivos",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "RUA SEBASTIAO BATISTA DOS SANTOS",
              "addressLocality": "Açailândia",
              "addressRegion": "MA",
              "postalCode": "65930-000",
              "addressCountry": "BR"
            },
            "telephone": "+55 99 98506-8943"
          }
        }
      }
    })),
    "numberOfItems": products.length
  };

  return (
    <main className="relative min-h-screen bg-[url('/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png')] bg-cover bg-center py-12">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Conteúdo da página */}
      <div className="container mx-auto px-4 relative z-10">
        <motion.button
          onClick={() => router.push('/servicos')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Serviços
        </motion.button>

        <h1 className="text-4xl font-bold mb-8 text-white">Nossos Produtos</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading && (
            <div className="col-span-full flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          )}
          {products.map((product, index) => (
            <motion.div
              key={`${product.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative aspect-square">
                {/* Verificar se o produto tem mídia do tipo vídeo */}
                {product.media?.some(m => m.type === 'video') ? (
                  <div className="relative w-full h-full">
                    <video
                      src={product.media.find(m => m.type === 'video')?.url || product.image}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : (
                  <img
                    src={product.media?.[0]?.url || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/80 text-sm">{product.category}</p>
                  <h3 className="text-white font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-white/90 font-bold">R$ {product.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-white/80">{product.description}</p>

                <div className="flex gap-3">
                  <Link
                    href={product.stripeId ? `/produtos/stripe/product/${product.stripeId}` : `/produtos/${product.id.split("-")[0]}s`}
                    className="flex-1"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white/20 backdrop-blur-sm text-white py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
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
                        image: product.media?.[0]?.url || "",
                        customization: null
                      });
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
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