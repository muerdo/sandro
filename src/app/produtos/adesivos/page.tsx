"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";
import type { ProductMedia } from "@/types/product";

const product = {
  id: "adesivo-personalizado",
  name: "Adesivo Personalizado",
  price: 29.90,
  description: "Adesivos de alta qualidade com impressão digital em vinil. Ideal para personalização de veículos, decoração ou identidade visual.",
  media: [
    {
      type: 'image' as const,
      url: "/img/adesivo.png",
      alt: "Adesivo personalizado - Vista frontal"
    },
    {
      type: 'image' as const,
      url: "/img/ads.jpeg",
      alt: "Adesivo personalizado - Aplicação"
    },
    {
      type: 'image' as const,
      url: "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?q=80&w=2574&auto=format&fit=crop",
      alt: "Adesivo personalizado - Detalhes"
    }
  ] satisfies ProductMedia[],
  features: [
    "Vinil de alta durabilidade",
    "Impressão digital HD",
    "Resistente à água",
    "Aplicação profissional",
    "Recorte eletrônico",
    "Garantia de 2 anos"
  ],
  customization: {
    types: ["Brilhante", "Fosco", "Transparente"],
    sizes: ["Pequeno", "Médio", "Grande", "Personalizado"]
  }
};

export default function AdesivosPage() {
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();
  
  const {
    selectedSize,
    setSelectedSize,
    selectedType,
    setSelectedType,
    selectedMedia,
    setSelectedMedia
  } = useProductCustomization({
    initialSize: product.customization.sizes[1],
    initialType: product.customization.types[0],
    sizes: product.customization.sizes,
    types: product.customization.types
  });

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    addItem({
      id: `${product.id}-${selectedSize}-${selectedType}`,
      name: `${product.name} - ${selectedType} ${selectedSize}`,
      price: product.price,
      image: product.media[0].url
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <ProductImages
            media={product.media}
            selectedMedia={selectedMedia || product.media[0]}
            onMediaSelect={setSelectedMedia}
            productName={product.name}
          />

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

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Tamanho</h3>
                <div className="flex gap-3">
                  {product.customization.sizes.map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg border-2 font-medium ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary'
                      }`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Acabamento</h3>
                <div className="flex gap-3">
                  {product.customization.types.map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg border-2 font-medium ${
                        selectedType === type
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary'
                      }`}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Características</h3>
              <ul className="grid grid-cols-2 gap-3">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

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
