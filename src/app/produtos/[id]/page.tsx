"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { extractIdFromSlug } from "@/lib/slug-utils";
import { fixSupabaseStorageUrl } from "@/lib/storage-utils";
import type { Product } from "@/types/product";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";

// Nota: Metadados são definidos em um arquivo separado para componentes Server

// Forçar revalidação da página para garantir que as alterações sejam refletidas
export const dynamic = 'force-dynamic';

export default function DynamicProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');

  const {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedMedia,
    setSelectedMedia
  } = useProductCustomization({
    initialSize: product?.customization?.sizes?.[0],
    initialColor: product?.customization?.colors?.[0],
    sizes: product?.customization?.sizes,
    colors: product?.customization?.colors,
    initialMedia: product?.media?.[0]
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!params.id) {
          toast.error('Produto não encontrado');
          router.push('/produtos');
          return;
        }

        // Extrair o ID do slug
        const productId = extractIdFromSlug(params.id);
        console.log('Buscando produto com ID/slug:', params.id, 'ID extraído:', productId);

        // Estratégia 1: Buscar pelo ID exato
        let { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        console.log('Resultado da busca por ID exato:', { data, error });

        // Se encontrou o produto, usar os dados
        if (!error && data) {
          console.log('Produto encontrado pelo ID exato:', data.id);
        } else {
          console.log('Produto não encontrado pelo ID exato, tentando busca por ID parcial...');

          // Estratégia 2: Buscar por ID parcial
          const { data: idData, error: idError } = await supabase
            .from('products')
            .select('*')
            .ilike('id', `%${productId}%`)
            .limit(1);

          if (!idError && idData && idData.length > 0) {
            data = idData[0];
            console.log('Produto encontrado pelo ID parcial:', data.id);
          } else {
            console.log('Produto não encontrado pelo ID parcial, tentando busca por nome...');

            // Estratégia 3: Buscar pelo nome (convertendo hifens em espaços)
            const searchName = params.id.replace(/-/g, ' ');
            const { data: nameData, error: nameError } = await supabase
              .from('products')
              .select('*')
              .ilike('name', `%${searchName}%`)
              .limit(1);

            if (!nameError && nameData && nameData.length > 0) {
              data = nameData[0];
              console.log('Produto encontrado pelo nome:', data.id, data.name);
            } else {
              console.log('Produto não encontrado pelo nome, tentando busca por categoria...');

              // Estratégia 4: Buscar pela categoria
              const { data: categoryData, error: categoryError } = await supabase
                .from('products')
                .select('*')
                .ilike('category', `%${searchName}%`)
                .limit(1);

              if (!categoryError && categoryData && categoryData.length > 0) {
                data = categoryData[0];
                console.log('Produto encontrado pela categoria:', data.id, data.category);
              } else {
                // Se nenhuma estratégia funcionou, exibir mensagem de erro
                console.error('Produto não encontrado após todas as tentativas');
                toast.error('Produto não encontrado');
                router.push('/produtos');
                return;
              }
            }
          }
        }

        console.log('Produto final encontrado:', data);

        if (!data) {
          toast.error('Produto não encontrado');
          router.push('/produtos');
          return;
        }

        // Mapear o produto para o formato esperado
        const transformedProduct: Product = {
          id: data.id,
          name: data.name || 'Produto sem nome',
          description: data.description || '',
          price: typeof data.price === 'number' ? data.price : 0,
          category: data.category || 'Outros',
          stock: data.stock || 999,
          status: (data.status as 'active' | 'draft' | 'archived') || 'active',
          low_stock_threshold: data.low_stock_threshold || 10,
          features: Array.isArray(data.features) ? data.features : [],
          customization: {
            sizes: Array.isArray((data.customization as any)?.sizes) ? (data.customization as any).sizes : ['P', 'M', 'G', 'GG'],
            colors: Array.isArray((data.customization as any)?.colors) ? (data.customization as any).colors : ['Preto', 'Branco', 'Azul', 'Vermelho']
          },
          media: [],
          image: ''
        };

        // Processar imagens
        if (Array.isArray(data.images) && data.images.length > 0) {
          transformedProduct.media = data.images.map(url => ({
            type: 'image' as const,
            url: fixSupabaseStorageUrl(url),
            alt: data.name || 'Imagem do produto'
          }));
          transformedProduct.image = fixSupabaseStorageUrl(data.images[0]);
        }

        // Processar mídia (se existir)
        // Verificar se o campo media existe e é um array
        const mediaField = (data as any).media;
        if (Array.isArray(mediaField) && mediaField.length > 0) {
          // Corrigir URLs em todos os itens de mídia
          transformedProduct.media = mediaField.map((media: any) => ({
            type: media.type || 'image',
            url: fixSupabaseStorageUrl(media.url),
            alt: media.alt || data.name || 'Imagem do produto',
            thumbnail: media.thumbnail ? fixSupabaseStorageUrl(media.thumbnail) : undefined
          }));

          if (mediaField[0]) {
            transformedProduct.image = fixSupabaseStorageUrl(mediaField[0].url);
          }
        }

        setProduct(transformedProduct);
        if (transformedProduct.media?.[0]) {
          setSelectedMedia(transformedProduct.media[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Erro ao carregar detalhes do produto');
        router.push('/produtos');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router]);

  const handleAddToCart = () => {
    if (!product) return;

    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Construir nome do produto com personalizações
    let productName = product.name;
    let customizations = '';

    if (selectedSize) {
      customizations += `Tamanho: ${selectedSize}`;
    }

    if (selectedColor) {
      customizations += customizations ? `, Cor: ${selectedColor}` : `Cor: ${selectedColor}`;
    }

    // Criar item do carrinho
    const cartItem = {
      id: `${product.id}${selectedSize ? `-${selectedSize}` : ''}${selectedColor ? `-${selectedColor}` : ''}`,
      name: `${productName}${customizations ? ` (${customizations})` : ''}`,
      price: product.price,
      image: selectedMedia?.url || product.media?.[0]?.url || product.image || '',
      quantity,
      customization: {
        size: selectedSize || '',
        color: selectedColor || '',
        notes: orderNotes.trim() || ''
      }
    };

    addItem(cartItem);
    toast.success('Produto adicionado ao carrinho!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent mx-auto" />
          <p className="text-muted-foreground animate-pulse">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O produto solicitado não foi encontrado.
          </p>
          <motion.button
            onClick={() => router.push('/produtos')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Produtos
          </motion.button>
        </div>
      </div>
    );
  }

  // Schema.org para SEO
  const schemaData = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.media?.map(m => m.url) || [product.image],
    "description": product.description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Sandro Adesivos"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.sandroadesivos.com.br/produtos/${params.id}`,
      "priceCurrency": "BRL",
      "price": product.price,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
  } : null;

  return (
    <main className="min-h-screen bg-background py-12">
      {product && schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => router.push('/produtos')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Produtos
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {product.media && product.media.length > 0 ? (
            <ProductImages
              media={product.media}
              selectedMedia={selectedMedia || product.media[0]}
              onMediaSelect={setSelectedMedia}
              productName={product.name}
            />
          ) : (
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground">Sem imagem disponível</p>
            </div>
          )}

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-3xl font-semibold text-primary">
                R$ {product.price.toFixed(2)}
              </p>
            </div>

            <p className="text-muted-foreground text-lg">
              {product.description}
            </p>

            {product.customization?.sizes && product.customization.sizes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tamanho</h3>
                <div className="flex flex-wrap gap-2">
                  {product.customization.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.customization?.colors && product.customization.colors.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cor</h3>
                <div className="flex flex-wrap gap-2">
                  {product.customization.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border ${
                        selectedColor === color
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Quantidade</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-lg border hover:bg-muted/50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-lg border hover:bg-muted/50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Observações</h3>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Adicione instruções especiais para este pedido..."
                className="w-full p-3 rounded-lg border bg-background"
                rows={3}
              />
            </div>

            {product.features && product.features.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Características</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Adicionar ao Carrinho
            </motion.button>
          </div>
        </div>
      </div>
    </main>
  );
}
