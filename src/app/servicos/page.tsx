"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Printer, Palette, Shirt, Scissors, MessageCircle } from "lucide-react";
import SearchFilters, { FilterOptions } from "@/components/search/search-filters";
import { useState, useMemo } from "react";

export default function ServicosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    category: null,
    priceRange: [0, 1000],
    attributes: []
  });
  const services = [
    {
      title: "Plotagem",
      icon: <Printer className="w-12 h-12" />,
      description: "Impressão em alta qualidade para grandes formatos",
      details: [
        "Banners e faixas",
        "Plantas arquitetônicas",
        "Pôsteres em grande formato",
        "Adesivos personalizados"
      ]
    },
    {
      title: "Adesivos",
      icon: <Palette className="w-12 h-12" />,
      description: "Adesivos personalizados para qualquer superfície",
      details: [
        "Adesivos para veículos",
        "Etiquetas personalizadas",
        "Adesivos decorativos",
        "Vinil recortado"
      ]
    },
    {
      title: "DTF e Camisetas",
      icon: <Shirt className="w-12 h-12" />,
      description: "Personalização profissional de vestuário",
      details: [
        "Impressão DTF em camisetas",
        "Uniformes empresariais",
        "Camisetas personalizadas",
        "Transfer digital"
      ]
    },
    {
      title: "Corte a Laser",
      icon: <Scissors className="w-12 h-12" />,
      description: "Precisão e qualidade em cada corte",
      details: [
        "Corte em acrílico",
        "Gravação em madeira",
        "Sinalização personalizada",
        "Brindes corporativos"
      ]
    }
  ];

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.details.some(detail => detail.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !activeFilters.category || service.title === activeFilters.category;
      
      const hasAttributes = activeFilters.attributes.length === 0 ||
                          activeFilters.attributes.some(attr => 
                            service.details.some(detail => detail.toLowerCase().includes(attr.toLowerCase()))
                          );

      return matchesSearch && matchesCategory && hasAttributes;
    });
  }, [services, searchQuery, activeFilters]);

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 space-y-8">
        <motion.button
          onClick={() => window.location.href = '/'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </motion.button>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-12 text-center"
        >
          Nossos Serviços
        </motion.h1>

        <SearchFilters 
          onSearch={setSearchQuery}
          onFilter={setActiveFilters}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="relative flex flex-col md:flex-row items-start gap-4 md:gap-6">
                <div className="bg-white/90 p-4 rounded-lg shadow-md">
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-2">{service.title}</h2>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {service.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="flex items-center gap-2 bg-white/50 p-2 rounded-lg"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-sm">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/produtos'}
                        className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        Ver Catálogo
                      </motion.button>
                    <motion.a
                      href={`https://wa.me/5599985068943?text=Olá! Gostaria de saber mais sobre o serviço de ${service.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
