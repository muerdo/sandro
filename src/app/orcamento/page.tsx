"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useState } from "react";

// Nota: Metadados são definidos em um arquivo separado para componentes Server

export default function OrcamentoPage() {
  const [servico, setServico] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    mensagem: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const servicoParam = params.get("servico");
    if (servicoParam) {
      setServico(servicoParam);
      setFormData(prev => ({
        ...prev,
        mensagem: `Olá, gostaria de solicitar um orçamento para o serviço de ${servicoParam}.`
      }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = encodeURIComponent(
      `*Novo Pedido de Orçamento*  ` +
      `*Serviço:* ${servico} ` +
      `*Nome:* ${formData.nome} ` +
      `*Email:* ${formData.email} ` +
      `*Telefone:* ${formData.telefone}  ` +
      `*Mensagem:* ${formData.mensagem}`
    );

    window.location.href = `https://whatsa.me/5599985068943/?t=${message}`;
  };

  // Schema.org para SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Orçamento de ${servico || 'Serviços de Comunicação Visual'}`,
    "description": "Solicite um orçamento personalizado para serviços de comunicação visual em Açailândia/MA",
    "provider": {
      "@type": "Organization",
      "name": "Sandro Adesivos",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "RUA SEBASTIAO BATISTA DOS SANTOS",
        "addressLocality": "Açailândia",
        "addressRegion": "MA",
        "postalCode": "65930-000",
        "addressCountry": "BR"
      },
      "telephone": "+55 99 98506-8943"
    }
  };

  return (
    <main className="min-h-screen bg-background py-12">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.button
          onClick={() => window.location.href = '/servicos'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Serviços
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-8 rounded-xl shadow-lg"
        >
          <h1 className="text-3xl font-bold mb-6">Solicitar Orçamento</h1>
          {servico && (
            <div className="mb-6 p-4 bg-primary/5 rounded-lg">
              <p className="text-lg">
                Serviço selecionado: <strong>{servico}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-3 rounded-lg border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 rounded-lg border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <input
                type="tel"
                required
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full p-3 rounded-lg border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mensagem</label>
              <textarea
                required
                value={formData.mensagem}
                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                rows={4}
                className="w-full p-3 rounded-lg border border-input bg-background resize-none"
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Enviar Solicitação
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
