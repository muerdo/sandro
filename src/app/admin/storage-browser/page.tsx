"use client";

import { useState, useEffect } from "react";
import { listStorageFiles, listProductImages } from "@/lib/storage-utils";
import { toast } from "sonner";
import { Copy, Check, Folder, Image, Video, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function StorageBrowserPage() {
  const [files, setFiles] = useState<Array<{name: string, url: string, type: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>('product-images');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      let filesList;
      if (currentPath === 'product-images') {
        filesList = await listProductImages();
      } else {
        filesList = await listStorageFiles('products', currentPath);
      }
      setFiles(filesList);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL copiada para a área de transferência');
    
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2000);
  };

  const handleRefresh = () => {
    loadFiles();
    toast.info('Atualizando lista de arquivos...');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Navegador de Arquivos</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </motion.button>
      </div>

      <div className="bg-card p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Caminho Atual: /{currentPath}</h2>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setCurrentPath('product-images')}
            className={`px-4 py-2 rounded-lg ${currentPath === 'product-images' ? 'bg-primary text-white' : 'bg-secondary'}`}
          >
            Imagens de Produtos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Arquivos ({files.length})</h2>
          
          {files.length === 0 ? (
            <div className="bg-card p-8 rounded-lg text-center">
              <p className="text-muted-foreground">Nenhum arquivo encontrado neste diretório</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => (
                <div key={file.name} className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    {file.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={file.url}
                          className="w-full h-full object-cover"
                          controls
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
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{file.type}</span>
                      <button
                        onClick={() => copyToClipboard(file.url)}
                        className="p-1 rounded-full hover:bg-muted"
                        title="Copiar URL"
                      >
                        {copiedUrl === file.url ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
