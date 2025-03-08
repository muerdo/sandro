"use client";

import { motion } from "framer-motion";
import { ArrowRight, Printer, Palette, Shirt, Scissors } from "lucide-react";

export default function HomePage() {
  const services = [
    {
      title: "Plotagem",
      icon: <Printer className="w-6 h-6" />,
      description: "Impressão em alta qualidade para grandes formatos"
    },
    {
      title: "Adesivos",
      icon: <Palette className="w-6 h-6" />,
      description: "Adesivos personalizados para qualquer superfície"
    },
    {
      title: "DTF e Camisetas",
      icon: <Shirt className="w-6 h-6" />,
      description: "Personalização profissional de vestuário"
    },
    {
      title: "Corte a Laser",
      icon: <Scissors className="w-6 h-6" />,
      description: "Precisão e qualidade em cada corte"
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
                className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-primary/5 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
