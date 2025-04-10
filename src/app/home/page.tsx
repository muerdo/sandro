"use client";

import { motion } from "framer-motion";
import { ArrowRight, Printer, Palette, Shirt, Scissors, MessageCircle } from "lucide-react";
import PortfolioGallery from "@/components/gallery/portfolio-gallery";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function HomePage() {
  const router = useRouter();
  const services = [
    {
      title: "Plotagem em Açailândia",
      icon: <Printer className="w-6 h-6" />,
      description: "Impressão digital em grande formato para banners, faixas e outdoors em Açailândia",
      image: "/img/ads.jpeg",
      slug: "plotagem"
    },
    {
      title: "Adesivos Personalizados",
      icon: <Palette className="w-6 h-6" />,
      description: "Adesivagem profissional para veículos, vitrines e fachadas em Açailândia",
      image: "/img/add.jpeg",
      slug: "adesivos"
    },
    {
      title: "DTF e Camisetas",
      icon: <Shirt className="w-6 h-6" />,
      description: "Personalização de camisetas e vestuário com tecnologia DTF em Açailândia",
      image: "/img/camisetass.jpeg",
      slug: "dtf-camisetas"
    },
    {
      title: "Corte a Laser",
      icon: <Scissors className="w-6 h-6" />,
      description: "Corte preciso em acrílico, MDF e outros materiais em Açailândia",
      image: "/img/laser.png",
      slug: "corte-laser"
    },
  ];

  // Adiciona schema.org ao DOM
  useEffect((): (() => void) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Sandro Adesivos",
      "image": "/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png",
      "description": "Comunicação visual profissional em Açailândia/MA",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "RUA SEBASTIAO BATISTA DOS SANTOS",
        "addressLocality": "Açailândia",
        "addressRegion": "MA",
        "postalCode": "65930-000",
        "addressCountry": "BR"
      },
      "telephone": "+55 99 98506-8943",
      "openingHours": "Mo-Fr 08:00-18:00",
      "priceRange": "$$",
      "url": "https://www.sandroadesivos.com.br",
      "sameAs": [
        "https://www.instagram.com/sandroadesivos",
        "https://www.facebook.com/sandroadesivos"
      ]
    });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section com Semântica Aprimorada */}
      <header className="relative h-[80vh] flex items-center justify-center bg-[url('/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Comunicação Visual Profissional em Açailândia
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Transforme suas ideias em realidade com nossa expertise em impressão digital,
              plotagem, adesivos e personalização. Atendemos toda a região de Açailândia/MA.
            </p>
            <motion.button
              onClick={() => router.push('/produtos')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
              aria-label="Explorar nossos produtos de comunicação visual"
            >
              Explorar Produtos
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </header>

      {/* Services Section com Microdados */}
      <section className="py-20 bg-background" itemScope itemType="https://schema.org/Service">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Nossos Serviços em Açailândia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <motion.article
                key={service.slug}
                itemScope
                itemType="https://schema.org/Service"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="absolute inset-0">
                  <img
                    src={service.image}
                    alt={`Serviço de ${service.title} em Açailândia`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    itemProp="image"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors" />
                </div>
                <div className="relative p-6 text-white">
                  <div className="bg-white/10 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2" itemProp="name">{service.title}</h3>
                  <p className="text-gray-200 mb-4" itemProp="description">{service.description}</p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => router.push(`/produtos?service=${service.slug}`)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      aria-label={`Ver produtos de ${service.title}`}
                    >
                      Ver Produtos
                    </motion.button>
                    <motion.a
                      href={`https://wa.me/5599985068943?text=Olá! Gostaria de saber mais sobre ${service.title} em Açailândia`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-[#25D366] text-white p-2 rounded-lg hover:bg-[#25D366]/90 transition-colors"
                      aria-label="Fale conosco no WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </motion.a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="relative py-20 bg-[url('/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Nossos Trabalhos em Açailândia
          </h2>
          <PortfolioGallery />
          <div className="text-center mt-12">
            <motion.button
              onClick={() => router.push('/portfolio')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              aria-label="Ver portfólio completo"
            >
              Ver Portfólio Completo
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Seção de CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Pronto para Transformar sua Ideia em Realidade?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Entre em contato agora mesmo e solicite um orçamento sem compromisso para seu projeto em Açailândia.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="https://wa.me/5599985068943"
              target="_blank"
              rel="noopener noreferrer nofollow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#25D366] text-white px-8 py-3 rounded-full font-medium hover:bg-[#25D366]/90 transition-colors inline-flex items-center gap-2"
              aria-label="Fale conosco no WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </motion.a>
           
          </div>
        </div>
      </section>
    </main>
  );
}
