"use client";

import { motion } from "framer-motion";
import { ArrowRight, Printer, Palette, Shirt, Scissors, MessageCircle } from "lucide-react";
import PortfolioGallery from "@/components/gallery/portfolio-gallery";
export default function HomePage() {
  const services = [{
    title: "Plotagem",
    icon: <Printer className="w-6 h-6" />,
    description: "Impressão em alta qualidade para grandes formatos",
    image: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop"
  }, {
    title: "Adesivos",
    icon: <Palette className="w-6 h-6" />,
    description: "Adesivos personalizados para qualquer superfície",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2671&auto=format&fit=crop"
  }, {
    title: "DTF e Camisetas",
    icon: <Shirt className="w-6 h-6" />,
    description: "Personalização profissional de vestuário",
    image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop"
  }, {
    title: "Corte a Laser",
    icon: <Scissors className="w-6 h-6" />,
    description: "Precisão e qualidade em cada corte",
    image: "https://picsum.photos/200"
  }];
  return <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Comunicação Visual Profissional
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transforme suas ideias em realidade com nossa expertise em impressão digital,
              plotagem, adesivos e personalização.
            </p>
            <motion.button onClick={() => window.location.href = '/servicos'} whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
              Explorar Serviços
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Serviços</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {services.map((service, index) => <motion.div key={service.title} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} className="group relative bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="absolute inset-0">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors" />
                </div>
                <div className="relative p-6 text-white">
                  <div className="bg-white/10 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-white/80 mb-4">{service.description}</p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => window.location.href = '/produtos'}
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
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Trabalhos</h2>
          <PortfolioGallery />
        </div>
      </section>
    </main>;
}
