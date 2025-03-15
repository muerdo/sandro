"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Lightbox } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
type Project = {
  id: number;
  title: string;
  category: "plotagem" | "adesivos" | "dtf" | "laser";
  image: string;
  description: string;
};
const projects: Project[] = [{
  id: 1,
  title: "Plotagem Arquitetônica",
  category: "plotagem",
  image: "/img/plot.png",
  description: "Impressão de alta precisão para projetos arquitetônicos"
}, {
  id: 2,
  title: "Adesivagem Veicular",
  category: "adesivos",
  image: "/img/1f1ce3cf-9e35-42c0-937b-10b913f7ae76.png",
  description: "Personalização completa de veículos"
}, {
  id: 3,
  title: "Camisetas Personalizadas",
  category: "dtf",
  image: "/img/camisetass.jpeg",
  description: "Estampas DTF de alta qualidade"
}, {
  id: 4,
  title: "Corte em Acrílico",
  category: "laser",
  image: "/img/laser.png",
  description: "Precisão em cortes a laser"
}, {
  id: 5,
  title: "Banner Promocional",
  category: "plotagem",
  image: "/img/468e1f83-8fd1-44c4-a0f2-c887b6d73434.png",
  description: "Banners de alta qualidade para eventos"
}, {
  id: 6,
  title: "Adesivos Decorativos",
  category: "adesivos",
  image: "/img/adesivo.png",
  description: "Adesivos personalizados para decoração"
}];
export default function PortfolioGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const filteredProjects = selectedCategory ? projects.filter(project => project.category === selectedCategory) : projects;
  const categories = [{
    id: "plotagem",
    label: "Plotagem"
  }, {
    id: "adesivos",
    label: "Adesivos"
  }, {
    id: "dtf",
    label: "DTF e Camisetas"
  }, {
    id: "laser",
    label: "Corte a Laser"
  }];
  const handleCategoryClick = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);
  return <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-2 md:gap-4">
        <motion.button onClick={() => handleCategoryClick(null)} className={`px-6 py-2 rounded-full transition-colors ${selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`} whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }}>
          Todos
        </motion.button>
        {categories.map(category => <motion.button key={category.id} onClick={() => handleCategoryClick(category.id)} className={`px-6 py-2 rounded-full transition-colors ${selectedCategory === category.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`} whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }}>
            {category.label}
          </motion.button>)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <AnimatePresence mode="wait">
          {filteredProjects.map(project => <motion.div key={project.id} layout initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.8
        }} transition={{
          duration: 0.3
        }} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer" onClick={() => setLightboxIndex(projects.findIndex(p => p.id === project.id))}>
              <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center p-4">
                <span className="text-white font-medium text-lg opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  {project.title}
                </span>
                <span className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity text-center mt-2">
                  {project.description}
                </span>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>

      <Lightbox open={lightboxIndex >= 0} close={() => setLightboxIndex(-1)} index={lightboxIndex} slides={projects.map(project => ({
      src: project.image,
      alt: project.title,
      title: project.title,
      description: project.description
    }))} />
    </div>;
}
