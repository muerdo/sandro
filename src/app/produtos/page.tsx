"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";

const products = [
  {
    id: "camiseta-personalizada",
    name: "Camiseta Personalizada",
    price: 49.90,
    image: "/img/camisas.png",
    category: "Vestuário",
    description: "Camisetas 100% algodão com impressão DTF",
    options: [
      { id: "tamanho", label: "Tamanho", values: ["P", "M", "G", "GG"] },
      { id: "cor", label: "Cor", values: ["Branco", "Preto", "Azul", "Vermelho"] },
    ],
  },
  {
    id: "adesivo-personalizado",
    name: "Adesivo Personalizado",
    price: 29.90,
    image: "/img/adesivo.png",
    category: "Adesivos",
    description: "Adesivos de alta qualidade em vinil"
  },
  {
    id: "banner-grande-formato",
    name: "Banner Grande Formato",
    price: 149.90,
    image: "/img/plot.jpeg",
    category: "Impressão",
    description: "Banners em lona com acabamento profissional"
  },
  {
    id: "caneca-personalizada",
    name: "Caneca Personalizada",
    price: 39.90,
    image: "/img/canecas.png",
    category: "Presentes",
    description: "Canecas de cerâmica com impressão sublimática",
    options: ["Cerâmica", "Porcelana", "Acrilica"],
  },
  {
    id: "laser",
    name: "Laser",
    price: 30,
    image: "/img/laser.png",
    category: "Laser",
    description: "Laser de alta qualidade",
    options: ["A4", "A3", "A2", "A1"],
  },
];

export default function CatalogoPage() {
  const { addItem } = useCart();

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
