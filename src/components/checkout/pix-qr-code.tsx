"use client";

import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PixQRCodeProps {
  pixCode: string;
  amount: number;
  expiresAt: string;
}

export default function PixQRCode({ pixCode, amount, expiresAt }: PixQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(pixCode);
        setCopied(true);
        toast.success('Código PIX copiado');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar código PIX');
    }
  };

  const timeLeft = () => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return minutes > 0 ? minutes : 0;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-card rounded-xl">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeCanvas 
          value={pixCode}
          size={200}
          level="H"
          includeMargin
        />
      </div>

      <div className="text-center space-y-2">
        <p className="text-2xl font-bold">R$ {amount.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">
          PIX code expires in {timeLeft()} minutes
        </p>
      </div>

      <div className="w-full">
        <div className="bg-secondary p-4 rounded-lg text-sm font-mono break-all">
          {pixCode}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className="w-full mt-2 bg-primary text-primary-foreground py-2 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy PIX Code
            </>
          )}
        </motion.button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Open your bank app and scan the QR code or copy the PIX code to complete your payment
      </p>
    </div>
  );
}
