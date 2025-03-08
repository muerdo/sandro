"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Printer, Palette, Shirt, Scissors } from "lucide-react";

export default function ServicosPage() {
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

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                <div className="bg-primary/5 p-4 rounded-lg">
                  {service.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{service.title}</h2>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.details.map((detail, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {detail}
                      </motion.li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = `/orcamento?servico=${service.title}`}
                    className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Solicitar Orçamento
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
