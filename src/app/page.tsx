import HeroSection from "@/components/landing/hero-section";


export const metadata = {
  title: "Sandro Adesivos - Comunicação Visual Profissional em Açailândia",
  description: "Sandro Adesivos em Açailândia-MA: adesivos personalizados, banners, letras caixa, fachadas, sinalização, camisetas e canecas personalizadas. Orçamento rápido e instalação profissional.",
  keywords: ["adesivos Açailândia, comunicação visual Maranhão, banners personalizados, letra caixa, fachadas comerciais, sinalização, impressão digital, camisetas personalizadas, canecas personalizadas, gráfica rápida Açailândia"],
  openGraph: {
    title: "Sandro Adesivos - Açailândia - Comunicação Visual Profissional",
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
