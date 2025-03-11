"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useProductCustomization } from "@/hooks/useProductCustomization";
import ProductImages from "@/components/products/product-images";

const product = {
  id: "camiseta-personalizada",
  name: "Camiseta Personalizada",
  price: 49.90,
  description: "Camiseta 100% algodão com impressão DTF de alta qualidade. Personalize com suas próprias artes ou escolha entre nossos designs exclusivos.",
  media: [
    {
      type: 'image',
      url: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop",
      alt: "Camiseta branca básica"
    },
    {
      type: 'video',
      url: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2680&auto=format&fit=crop",
      alt: "Vídeo demonstrativo da camiseta"
    },
    {
      type: 'image',
      url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=2680&auto=format&fit=crop",
      alt: "Detalhes da camiseta"
    }
  ],
  features: [
    "Impressão DTF de alta durabilidade",
    "100% Algodão",
    "Disponível em várias cores",
    "Tamanhos P ao GG",
    "Personalização total",
    "Acabamento profissional"
  ],
  customization: {
    colors: ["Branco", "Preto", "Cinza", "Azul Marinho"],
    sizes: ["P", "M", "G", "GG"]
  }
};

export default function CamisetasPage() {
  const { user } = useAuth();
  const { addItem, setShowAuthDialog } = useCart();

  const {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedImage,
    setSelectedImage
  } = useProductCustomization({
    initialSize: product.customization.sizes[1],
    initialColor: product.customization.colors[0],
    sizes: product.customization.sizes,
    colors: product.customization.colors
  });

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    addItem({
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      name: `${product.name} - ${selectedColor} ${selectedSize}`,
      price: product.price,
      image: product.images[0]
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

        <div className="grid grid-cols-2 gap-12">
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
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-medium ${
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
                <h3 className="text-lg font-medium mb-3">Cor</h3>
                <div className="flex gap-3">
                  {product.customization.colors.map((color) => (
                    <motion.button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg border-2 font-medium ${
                        selectedColor === color
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary'
                      }`}
                    >
                      {color}
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
