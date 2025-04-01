// src/app/checkout/pending/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Componente separado para usar useSearchParams
function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Pedido Criado</h1>
        <p className="text-muted-foreground">
          Seu pedido #{orderId ? orderId.slice(0, 8) : "N/A"} foi criado e está aguardando confirmação de pagamento.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Voltar para a Home
        </button>
      </div>
    </div>
  );
}

// Página principal com Suspense
export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}