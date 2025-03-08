"use client";

import HeroSection from "@/components/landing/hero-section";
import ScrollIndicator from "@/components/landing/scroll-indicator";

export default function LandingPage() {
  return (
    <main className="h-screen overflow-hidden">
      <HeroSection />
      <ScrollIndicator />
    </main>
  );
}
