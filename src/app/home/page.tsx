"use client";

import { motion } from "framer-motion";
import { ArrowRight, Printer, Palette, Shirt, Scissors } from "lucide-react";

export default function HomePage() {
  const services = [
    {
      title: "Plotagem",
      icon: <Printer className="w-6 h-6" />,
      description: "Impressão em alta qualidade para grandes formatos",
      image: "https://images.unsplash.com/photo-1588412079929-790b9f593d8e?q=80&w=2574&auto=format&fit=crop"
    },
    {
      title: "Adesivos",
      icon: <Palette className="w-6 h-6" />,
      description: "Adesivos personalizados para qualquer superfície",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2671&auto=format&fit=crop"
    },
    {
      title: "DTF e Camisetas",
      icon: <Shirt className="w-6 h-6" />,
      description: "Personalização profissional de vestuário",
      image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2669&auto=format&fit=crop"
    },
    {
      title: "Corte a Laser",
      icon: <Scissors className="w-6 h-6" />,
      description: "Precisão e qualidade em cada corte",
      image: "https://images.unsplash.com/photo-1635348729252-49c28a326463?q=80&w=2670&auto=format&fit=crop"
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Comunicação Visual Profissional
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transforme suas ideias em realidade com nossa expertise em impressão digital,
              plotagem, adesivos e personalização.
            </p>
            <motion.button
              onClick={() => window.location.href = '/servicos'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
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
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Serviços</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <p className="text-white/80">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Trabalhos</h2>
          <div className="grid grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item * 0.1 }}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              >
                <img 
                  src={`https://images.unsplash.com/photo-${item + 1}?q=80&w=1000&auto=format&fit=crop`}
                  alt={`Portfolio ${item}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Projeto
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
