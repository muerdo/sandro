"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/types/product";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();
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

  const handleAddToCart = () => {
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

    const cartItem = {
      id: `${product.id}${selectedSize ? `-${selectedSize}` : ''}${selectedColor ? `-${selectedColor}` : ''}`,
      name: `${productName}${customizations ? ` (${customizations})` : ''}`,
      price: product.price,
      image: selectedMedia?.url || product.image || '',
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
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
  const schemaData = {
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
      "url": `https://www.sandroadesivos.com.br/produtos/${product.id}`,
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
  };

  return (
    <main className="min-h-screen bg-background py-12">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
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
          ) : product.image ? (
            <div className="aspect-square rounded-xl overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-xl bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Sem imagem</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mt-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            {product.customization && product.customization.sizes && product.customization.sizes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tamanho</h3>
                <div className="flex flex-wrap gap-2">
                  {product.customization.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary transition-colors'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.customization && product.customization.colors && product.customization.colors.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cor</h3>
                <div className="flex flex-wrap gap-2">
                  {product.customization.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border ${
                        selectedColor === color
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary transition-colors'
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:border-primary transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:border-primary transition-colors"
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
                placeholder="Adicione instruções especiais para o seu pedido..."
                className="w-full p-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none h-24"
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
