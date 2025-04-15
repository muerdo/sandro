"use client";

import { ReactNode } from "react";
import abacatepay from "@/hooks/abacatepay";

// Verificar se a chave de API está configurada
if (!process.env.NEXT_PUBLIC_ABACATEPAY_API_KEY) {
  console.warn('Missing AbacatePay API key');
}

export function AbacatePayProvider({ children }: { children: ReactNode }) {
  // Verificar se a API está disponível
  if (!process.env.NEXT_PUBLIC_ABACATEPAY_API_KEY) {
    console.error('Missing AbacatePay API key');
    return null;
  }

  return (
    <div className="abacatepay-provider">
      {children}
    </div>
  );
}
