"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import abacatepay from "@/hooks/abacatepay";

interface PixQRCodeProps {
  pixCode: string;
  amount: number;
  expiresAt: string;
  transactionId?: string;
  qrCodeImage?: string;
  onConfirmPayment?: () => void; // Adicione essa prop
}

export default function PixQRCode({
  pixCode,
  amount,
  expiresAt,
  transactionId,
  qrCodeImage,
  onConfirmPayment, // Recebe a função de confirmação manual
}: PixQRCodeProps) {
  const [countdown, setCountdown] = useState<string>("30:00");
  const [copied, setCopied] = useState<boolean>(false);
  const [expired, setExpired] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("PENDING");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Calculate countdown from expiresAt
  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(expiresAt).getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setExpired(true);
        setCountdown("Expirado");
        return;
      }

      // Convert to minutes and seconds
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Update countdown immediately
    const timeLeft = calculateTimeLeft();
    if (timeLeft) setCountdown(timeLeft);

    // Then update every second
    const timer = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      if (timeLeft) {
        setCountdown(timeLeft);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  // Check payment status periodically if we have a transaction ID
  useEffect(() => {
    if (!transactionId) return;

    // Variável para controlar se o componente está montado
    let isMounted = true;

    const checkStatus = async () => {
      try {
        console.log('Verificando status do PIX para transactionId:', transactionId);

        // Usar o hook do AbacatePay para verificar o status
        const statusData = await abacatepay.checkPixStatus(transactionId);
        console.log('Status do PIX recebido:', statusData);

        // Verificar se o componente ainda está montado antes de atualizar o estado
        if (!isMounted) return false;

        // Verificar se a resposta contém um status válido
        if (!statusData || !statusData.status) {
          console.error('Resposta inválida ao verificar status do PIX:', statusData);
          return false;
        }

        setStatus(statusData.status);

        if (statusData.status === "PAID" || statusData.status === "COMPLETED") {
          // Stop checking if payment is completed
          toast.success("Pagamento PIX recebido com sucesso!");
          return true;
        }

        return false;
      } catch (error) {
        console.error("Error checking PIX status:", error);
        return false;
      }
    };

    // Check immediately
    let initialCheckCompleted = false;
    checkStatus().then(completed => {
      initialCheckCompleted = completed;
    });

    // Then check every 5 seconds, mas apenas se o primeiro check não completou
    const interval = setInterval(async () => {
      if (initialCheckCompleted) {
        clearInterval(interval);
        return;
      }

      const completed = await checkStatus();
      if (completed) {
        clearInterval(interval);
      }
    }, 5000);

    // Limpar o intervalo e marcar o componente como desmontado quando ele for desmontado
    return () => {
      clearInterval(interval);
      isMounted = false;
    };
  }, [transactionId]); // Apenas transactionId como dependência

  // Handle copy to clipboard
  const handleCopyPix = () => {
    if (!pixCode) return;

    navigator.clipboard.writeText(pixCode)
      .then(() => {
        setCopied(true);
        toast.success("Código PIX copiado!");

        // Reset copy status after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy PIX code:", err);
        toast.error("Erro ao copiar código PIX");
      });
  };

  // Handle manual refresh of status
  const handleRefreshStatus = async () => {
    if (!transactionId || refreshing) return;

    setRefreshing(true);

    try {
      console.log('Atualizando status do PIX manualmente para transactionId:', transactionId);

      // Usar o hook do AbacatePay para verificar o status
      const statusData = await abacatepay.checkPixStatus(transactionId);
      console.log('Status do PIX recebido (atualização manual):', statusData);

      // Verificar se a resposta contém um status válido
      if (!statusData || !statusData.status) {
        throw new Error('Resposta inválida ao verificar status do PIX');
      }

      setStatus(statusData.status);

      if (statusData.status === "PAID" || statusData.status === "COMPLETED") {
        toast.success("Pagamento PIX recebido com sucesso!");
      } else {
        toast.info("Status atualizado!");
      }
    } catch (error) {
      console.error("Error refreshing PIX status:", error);
      toast.error("Erro ao atualizar status do pagamento");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Pagamento via PIX</h3>
          <p className="text-gray-600 mb-6">Escaneie o QR Code ou copie o código PIX para pagar</p>

          <div className="mb-6 flex flex-col items-center">
            <div className="w-48 h-48 border-2 border-primary p-2 rounded-md mb-4">
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="QR Code PIX"
                  className="w-full h-full"
                />
              ) : pixCode ? (
                <QRCodeSVG
                  value={pixCode}
                  size={176}
                  level="H"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Carregando...
                </div>
              )}
              {/* Debug info */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="absolute top-0 right-0 bg-yellow-100 text-xs p-1 rounded">
                  {pixCode ? 'PIX Code OK' : 'No PIX Code'}
                </div>
              )}
            </div>

            <div className="bg-gray-100 p-3 rounded w-full mb-3 relative">
              <p className="text-xs text-gray-600 mb-1">Código PIX</p>
              {pixCode ? (
                <p className="text-sm break-all pr-8">{pixCode}</p>
              ) : (
                <p className="text-sm text-gray-400">Carregando código PIX...</p>
              )}

              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark"
                onClick={handleCopyPix}
                disabled={!pixCode || expired || status === "EXPIRED" || status === "COMPLETED"}
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>

            <div className="mt-2 text-center">
              <div className="text-sm text-gray-600 mb-1">Válido por:</div>
              <div className={`text-lg font-semibold ${expired || status === "EXPIRED" ? "text-red-500" : ""}`}>
                {status === "COMPLETED" ? "Pagamento confirmado" : countdown}
              </div>
            </div>

            {/* Botão de confirmação manual */}
            {onConfirmPayment && (
              <Button
                onClick={onConfirmPayment}
                className="mt-4"
                disabled={status === "COMPLETED" || status === "EXPIRED"}
              >
                Confirmar Pagamento Manualmente
              </Button>
            )}
          </div>
        </div>
        <div className="border-l-0 md:border-l border-gray-200 pl-0 md:pl-8">
          <h3 className="text-lg font-semibold mb-4">Informações do Pagamento</h3>

          <div className="space-y-3 mb-6">
            <div>
              <p className="text-sm text-gray-600">Valor</p>
              <p className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recebedor</p>
              <p className="font-medium">Sandro Adesivos</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Banco</p>
              <p className="font-medium">Nu Bank</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chave PIX</p>
              <p className="font-medium">59f7435a-b326-4cc2-9f68-f1b6be3c6d10</p>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium mb-2">Como pagar:</h4>
            <ol className="text-sm text-gray-600 space-y-2 pl-5 list-decimal">
              <li>Abra o aplicativo do seu banco</li>
              <li>Acesse a opção PIX</li>
              <li>Escaneie o QR Code ou copie e cole o código PIX</li>
              <li>Confirme as informações do pagamento</li>
              <li>Conclua o pagamento</li>
            </ol>
          </div>

          <div className="mt-6">
            {status === "COMPLETED" ? (
              <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-100 flex items-center">
                <span className="mr-2">✓</span>
                <span>Pagamento confirmado!</span>
              </div>
            ) : status === "EXPIRED" ? (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 flex items-center">
                <span className="mr-2">⏱</span>
                <span>Pagamento expirado</span>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">⏱</span>
                  <span>Aguardando pagamento...</span>
                </div>
                {transactionId && (
                  <button
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {refreshing ? '↻' : '↻'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}