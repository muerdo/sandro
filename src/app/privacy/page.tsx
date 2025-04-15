"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

// Nota: Metadados são definidos em um arquivo separado para componentes Server

export default function PrivacyPolicyPage() {
  const router = useRouter();

  // Schema.org para SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Política de Privacidade - Sandro Adesivos",
    "description": "Política de privacidade da Sandro Adesivos. Saiba como tratamos seus dados pessoais e protegemos sua privacidade.",
    "publisher": {
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
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </motion.button>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground">
              Coletamos informações que você nos fornece diretamente ao utilizar nossos serviços, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Informações de contato (nome, e-mail, telefone)</li>
              <li>Endereço para entrega</li>
              <li>Informações de pagamento</li>
              <li>Histórico de pedidos</li>
              <li>Preferências de comunicação</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">2. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Processar seus pedidos e transações</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Enviar atualizações sobre seus pedidos</li>
              <li>Melhorar nossos produtos e serviços</li>
              <li>Personalizar sua experiência</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">3. Proteção de Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">4. Seus Direitos</h2>
            <p className="text-muted-foreground">
              Você tem o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados imprecisos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Retirar seu consentimento</li>
              <li>Receber seus dados em formato estruturado</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">5. Contato</h2>
            <p className="text-muted-foreground">
              Para questões relacionadas à privacidade, entre em contato conosco através do e-mail: privacy@visualprint.com
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
