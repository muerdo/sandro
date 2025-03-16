"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";
import type { ProductMedia } from "@/types/product";

const product = {
  id: "caneca-personalizada",
  name: "Caneca Personalizada",
  price: 39.9,
  description:
    "Canecas de cerâmica premium com impressão sublimática de alta qualidade. Personalize com suas fotos, designs ou escolha entre nossos modelos exclusivos.",
  media: [
    {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2670&auto=format&fit=crop",
      alt: "Caneca branca com design personalizado",
    },
    {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1481671703460-040cb8a2d909?q=80&w=2670&auto=format&fit=crop",
      alt: "Conjunto de canecas personalizadas",
    },
    {
      type: "image" as const,
      url: "/img/canecas.png",
      alt: "Detalhes da impressão na caneca",
    },
  ] satisfies ProductMedia[],
  features: [
    "Cerâmica de alta qualidade",
    "Impressão sublimática durável",
    "Capacidade: 325ml",
    "Resistente à microondas",
    "Acabamento brilhante",
    "Garantia de qualidade",
  ],
  customization: {
    types: ["Branca", "Preta", "Mágica", "Fosca"],
    designs: ["Personalizado", "Modelo 1", "Modelo 2", "Modelo 3"],
  },
};

export default function CanecasPage() {
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();

  const {
    selectedType,
    setSelectedType,
    selectedMedia,
    setSelectedMedia,
  } = useProductCustomization({
    initialType: product.customization.types[0],
    types: product.customization.types,
    initialMedia: product.media[0],
  });

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    addItem({
      id: `${product.id}-${selectedType}`,
      name: `${product.name} - ${selectedType}`,
      price: product.price,
      image: selectedMedia?.url || product.media[0].url,
    });
  };

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => (window.location.href = "/servicos")}
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
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                {product.name}
              </h1>
              <p className="text-2xl sm:text-3xl font-semibold text-primary">
                R$ {product.price.toFixed(2)}
              </p>
            </div>

            <p className="text-muted-foreground text-base sm:text-lg">
              {product.description}
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Modelo</h3>
                <div className="flex flex-wrap gap-3">
                  {product.customization.types.map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg border-2 font-medium ${
                        selectedType === type
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:border-primary"
                      }`}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Design</h3>
                <div className="flex flex-wrap gap-3">
                  {product.customization.designs.map((design) => (
                    <motion.button
                      key={design}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg border-2 border-input hover:border-primary font-medium"
                    >
                      {design}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Características</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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