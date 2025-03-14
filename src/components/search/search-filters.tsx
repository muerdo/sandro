"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  category: string | null;
  priceRange: [number, number];
  attributes: string[];
}

export default function SearchFilters({ onSearch, onFilter }: SearchFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    category: null,
    priceRange: [0, 1000],
    attributes: []
  });

  const categories = [
    "Todos",
    "Plotagem",
    "Adesivos",
    "DTF e Camisetas",
    "Corte a Laser"
  ];

  const attributes = [
    "Alta Resolução",
    "Personalizado",
    "Entrega Rápida",
    "Grande Formato"
  ];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
          />
        </div>
        <motion.button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
        </motion.button>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: isFiltersOpen ? "auto" : 0,
          opacity: isFiltersOpen ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-card rounded-lg border space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  onClick={() =>
                    handleFilterChange({
                      category: category === "Todos" ? null : category
                    })
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.category === category ||
                    (category === "Todos" && !filters.category)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Faixa de Preço</h3>
            <div className="px-3">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={filters.priceRange}
                onValueChange={(value) =>
                  handleFilterChange({ priceRange: value as [number, number] })
                }
                max={1000}
                step={50}
              >
                <Slider.Track className="bg-secondary relative grow rounded-full h-[3px]">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-5 h-5 bg-primary shadow-lg rounded-full hover:bg-primary/90 focus:outline-none"
                  aria-label="Preço mínimo"
                />
                <Slider.Thumb
                  className="block w-5 h-5 bg-primary shadow-lg rounded-full hover:bg-primary/90 focus:outline-none"
                  aria-label="Preço máximo"
                />
              </Slider.Root>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>R$ {filters.priceRange[0]}</span>
                <span>R$ {filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Atributos</h3>
            <div className="flex flex-wrap gap-2">
              {attributes.map((attribute) => (
                <motion.button
                  key={attribute}
                  onClick={() =>
                    handleFilterChange({
                      attributes: filters.attributes.includes(attribute)
                        ? filters.attributes.filter((a) => a !== attribute)
                        : [...filters.attributes, attribute]
                    })
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.attributes.includes(attribute)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {attribute}
                </motion.button>
              ))}
            </div>
          </div>

          {(searchQuery || filters.category || filters.attributes.length > 0) && (
            <motion.button
              onClick={() => {
                setSearchQuery("");
                setFilters({
                  category: null,
                  priceRange: [0, 1000],
                  attributes: []
                });
                onSearch("");
                onFilter({
                  category: null,
                  priceRange: [0, 1000],
                  attributes: []
                });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 text-sm text-primary"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
