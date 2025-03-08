"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Lightbox } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { MessageCircle } from "lucide-react"; // Importe o ícone do WhatsApp

type Project = {
  id: number;
  title: string;
  category: "plotagem" | "adesivos" | "dtf" | "laser" |"escritorio" | "canecas" | "grafica rapida";
  image: string;
  description: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: "Plotagem Arquitetônica",
    category: "plotagem",
    image: "/img/plot.png",
    description: "Impressão de alta precisão para projetos arquitetônicos",
  },
  {
    id: 2,
    title: "Adesivagem Veicular",
    category: "adesivos",
    image: "/img/adesivo.png",
    description: "Personalização completa de veículos",
  },
  {
    id: 3,
    title: "Camisetas Personalizadas",
    category: "dtf",
    image: "/img/tshirt.png",
    description: "Estampas DTF de alta qualidade",
  },
  {
    id: 4,
    title: "Corte em Acrílico",
    category: "laser",
    image: "/img/corte.png",
    description: "Precisão em cortes a laser",
  },
  {
    id: 5,
    title: "Banner Promocional",
    category: "plotagem",
    image: "/img/468e1f83-8fd1-44c4-a0f2-c887b6d73434.png",
    description: "Banners de alta qualidade para eventos",
  },
  {
    id: 6,
    title: "Adesivos Decorativos",
    category: "adesivos",
    image: "/img/adess.png",
    description: "Adesivos personalizados para decoração",
  },
  {
    id: 7,
    title: "Escritório",
    category: "escritorio",
    image: "/img/bloco.png",
    description: "blocos de notas, cartões de visita, etc",
  },
  {
    id: 8,
    title: "Canecas Personalizadas",
    category: "canecas",
    image: "/img/canecas.png",
    description: "Canecas personalizadas com estampas",
  },
  {
    id: 9,
    title: "Grafica Rápida",
    category: "grafica rapida",
    image: "/img/grafica.png",
    description: "Grafica rápida para pequenos projetos",
  },
];

export default function PortfolioGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const filteredProjects = selectedCategory
    ? projects.filter((project) => project.category === selectedCategory)
    : projects;

  const categories = [
    { id: "plotagem", label: "Plotagem" },
    { id: "adesivos", label: "Adesivos" },
    { id: "dtf", label: "DTF e Camisetas" },
    { id: "laser", label: "Corte a Laser" },
    { id: "escritorio", label: "Escritório" },
    { id: "canecas", label: "Canecas" },
    { id: "grafica rapida", label: "Grafica Rápida" },
  ];

  const handleCategoryClick = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  return (
    <div className="space-y-8">
      {/* Filtros de Categoria */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4">
        <motion.button
          onClick={() => handleCategoryClick(null)}
          className={`px-6 py-2 rounded-full transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Todos
        </motion.button>
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`px-6 py-2 rounded-full transition-colors ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* Galeria de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <AnimatePresence mode="wait">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              onClick={() =>
                setLightboxIndex(projects.findIndex((p) => p.id === project.id))
              }
            >
              {/* Imagem do Projeto */}
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay com Título, Descrição e Botões de Ação */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center p-4">
                <span className="text-white font-medium text-lg opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  {project.title}
                </span>
                <span className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity text-center mt-2">
                  {project.description}
                </span>

                {/* Botões de Ação */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que o clique abra o lightbox
                      window.location.href = `/orcamento?servico=${project.title}`;
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    Solicitar Orçamento
                  </motion.button>
                  <motion.a
                    href={`https://wa.me/5599985068943?text=Olá! Gostaria de saber mais sobre o projeto de ${project.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()} // Evita que o clique abra o lightbox
                    className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox para Visualização de Imagens */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={projects.map((project) => ({
          src: project.image,
          alt: project.title,
          title: project.title,
          description: project.description,
        }))}
      />
    </div>
  );
}