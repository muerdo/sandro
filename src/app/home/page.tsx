"use client";

import { motion } from "framer-motion";
import { ArrowRight, Printer, Palette, Shirt, Scissors, MessageCircle } from "lucide-react";
import PortfolioGallery from "@/components/gallery/portfolio-gallery";

export default function HomePage() {
  const services = [
    {
      title: "Plotagem",
      icon: <Printer className="w-6 h-6" />,
      description: "Impressão em alta qualidade para grandes formatos",
      image: "/img/plot.png",
    },
    {
      title: "Adesivos",
      icon: <Palette className="w-6 h-6" />,
      description: "Adesivos personalizados para qualquer superfície",
      image: "/img/adesivo.png",
    },
    {
      title: "DTF e Camisetas",
      icon: <Shirt className="w-6 h-6" />,
      description: "Personalização profissional de vestuário",
      image: "/img/camisetass.jpeg",
    },
    {
      title: "Corte a Laser",
      icon: <Scissors className="w-6 h-6" />,
      description: "Precisão e qualidade em cada corte",
      image: "/img/laser.png",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-[url('/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6 text-white">
              Comunicação Visual Profissional
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Transforme suas ideias em realidade com nossa expertise em impressão digital,
              plotagem, adesivos e personalização.
            </p>
            <motion.button
              onClick={() => (window.location.href = "/produtos")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
            >
              Explorar Serviços
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Nossos Serviços
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="absolute inset-0">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors" />
                </div>
                <div className="relative p-6 text-white">
                  <div className="bg-white/10 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-gray-200 mb-4">{service.description}</p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => (window.location.href = "/produtos")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Ver Produtos
                    </motion.button>
                    <motion.a
                      href={`https://wa.me/5599985068943?text=Olá! Gostaria de saber mais sobre o serviço de ${service.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-[#25D366] text-white p-2 rounded-lg hover:bg-[#25D366]/90 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="relative py-20 bg-[url('/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Nossos Trabalhos
          </h2>
          <PortfolioGallery />
        </div>
      </section>
    </main>
  );
}