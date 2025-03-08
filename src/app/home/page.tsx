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
      image: "/img/tshirt.png",
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
      <section
        className="h-screen relative flex items-center justify-center bg-black" // Fundo preto
      >
        {/* Imagem de fundo sutil com overlay escuro */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20" // Ajuste a opacidade aqui
          style={{
            backgroundImage: `url(${
              process.env.NEXT_PUBLIC_CLIENT_HERO_IMAGE || "/img/logo.jpeg"
            })`,
            backgroundSize: "contain", // Ajusta o tamanho da imagem para caber dentro da seção
            backgroundRepeat: "no-repeat", // Evita que a imagem se repita
            backgroundPosition: "center", // Centraliza a imagem
          }}
        ></div>

        {/* Conteúdo da Hero Section */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Título com cor branca */}
            <h1 className="text-5xl font-bold mb-6 text-white">
              Transforme suas ideias em realidade
            </h1>

            {/* Descrição com texto branco e opacidade ajustada */}
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              No coração de Açailândia, Maranhão, o <strong>Sandro Adesivos</strong> traz soluções completas em comunicação visual. Com expertise em impressão digital, plotagem, adesivos personalizados e muito mais, nós damos vida às suas ideias.
            </p>

            {/* Botão com destaque */}
            <motion.button
              onClick={() => (window.location.href = "/servicos")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
            >
              Explorar Serviços
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white relative">
        {/* Imagem de fundo sutil com overlay claro */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10" // Ajuste a opacidade aqui
          style={{
            backgroundImage: `url(${
              process.env.NEXT_PUBLIC_CLIENT_HERO_IMAGE || "/img/0988831c-88dd-4ea8-8f94-f1a94d862e40.png"
            })`,
          }}
        ></div>

        {/* Conteúdo da seção */}
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Nossos Serviços
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
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

                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        (window.location.href = `/orcamento?servico=${service.title}`)
                      }
                      className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                    >
                      Solicitar Orçamento
                    </motion.button>
                    <motion.a
                      href={`https://wa.me/5599985068943?text=Olá! Gostaria de saber mais sobre o serviço de ${service.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section
        className="py-20 relative"
        style={{
          backgroundImage: `url(${process.env.NEXT_PUBLIC_CLIENT_HERO_IMAGE || "/img/das.png"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay escuro para o fundo */}
        <div className="absolute inset-0 bg-black/70"></div>

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