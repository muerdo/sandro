"use client";

import { useState, useEffect } from "react";
import { listProductImages } from "@/lib/storage-utils";
import { toast } from "sonner";
import { X, Image, Video, RefreshCw, Check, Search } from "lucide-react";
import { motion } from "framer-motion";

interface StorageSelectorProps {
  onSelect: (files: Array<{url: string, type: 'image' | 'video', alt?: string, thumbnail?: string}>) => void;
  onClose: () => void;
  maxSelection?: number;
}

export default function StorageSelector({ onSelect, onClose, maxSelection = 10 }: StorageSelectorProps) {
  const [files, setFiles] = useState<Array<{name: string, url: string, type: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Array<{name: string, url: string, type: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const filesList = await listProductImages();
      setFiles(filesList);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFiles();
    toast.info('Atualizando lista de arquivos...');
  };

  const toggleFileSelection = (file: {name: string, url: string, type: string}) => {
    if (selectedFiles.some(f => f.url === file.url)) {
      setSelectedFiles(selectedFiles.filter(f => f.url !== file.url));
    } else {
      if (selectedFiles.length >= maxSelection) {
        toast.warning(`Você pode selecionar no máximo ${maxSelection} arquivos`);
        return;
      }
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const handleConfirm = () => {
    if (selectedFiles.length === 0) {
      toast.warning('Selecione pelo menos um arquivo');
      return;
    }

    // Converter para o formato esperado pelo componente de produto
    const formattedFiles = selectedFiles.map(file => ({
      url: file.url,
      type: file.type === 'video' ? 'video' as const : 'image' as const,
      alt: `Arquivo ${file.name}`,
      thumbnail: file.type === 'video' ? undefined : undefined
    }));

    onSelect(formattedFiles);
    onClose();
  };

  const filteredFiles = searchTerm 
    ? files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : files;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Selecionar Arquivos</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar arquivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-card p-8 rounded-lg text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum arquivo encontrado para esta busca' : 'Nenhum arquivo encontrado'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div 
                  key={file.name} 
                  onClick={() => toggleFileSelection(file)}
                  className={`bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative ${
                    selectedFiles.some(f => f.url === file.url) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="aspect-square relative">
                    {file.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={file.url}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                          <Image className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {selectedFiles.some(f => f.url === file.url) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white p-2 rounded-full">
                          <Check className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedFiles.length} de {maxSelection} arquivos selecionados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-muted"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirm}
              className="bg-primary text-white px-4 py-2 rounded-lg"
              disabled={selectedFiles.length === 0}
            >
              Adicionar Selecionados
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
