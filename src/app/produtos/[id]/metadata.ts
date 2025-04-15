import type { Metadata } from 'next';

// Função para gerar metadados dinâmicos com base nos parâmetros da rota
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  return {
    title: `Produto ${params.id} - Sandro Adesivos Açailândia`,
    description: `Detalhes do produto ${params.id}. Produtos personalizados de alta qualidade em Açailândia/MA. Comunicação visual profissional para sua empresa ou evento.`,
    keywords: ["produto personalizado", "comunicação visual Açailândia", params.id, "Sandro Adesivos", "Maranhão"],
  };
}
