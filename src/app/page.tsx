import HeroSection from "@/components/landing/hero-section";


export const metadata = {
  title: "Sandro Adesivos - Comunicação Visual Profissional em Açailândia",
  description: "Fabricação de adesivos personalizados, letras caixa e sinalização em Açailândia. Qualidade profissional com orçamento rápido e instalação especializada.",
  keywords: ["adesivos", "comunicação visual", "sinalização", "Sandro Adesivos", "Maranhão", "acailandia", "açailandia", "letra caixa", "fachadas", "Açailândia"],
  openGraph: {
    title: "Sandro Adesivos - Comunicação Visual Profissional",
    description: "Transforme suas ideias em realidade com nossos serviços de comunicação visual",
    images: [
      {
        url: process.env.NEXT_PUBLIC_CLIENT_HERO_IMAGE || '/img/f2641af2-a4f1-4d08-9ac6-ac9f5de307c2.png',
        width: 1200,
        height: 630,
        alt: 'Comunicação Visual Profissional',
      },
    ],
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <HeroSection />
    </main>
  );
}
