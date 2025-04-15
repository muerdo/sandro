// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { generatePixCode } from "@/app/api/payment/pix/pix";
import { storage } from "@/app/api/payment/pix/storage";
import { InsertPixTransaction } from "@/app/shared/schema";
import abacatepay from "@/hooks/abacatepay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, type } = body;

    // Validação dos campos
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { message: "Valor inválido ou ausente" },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { message: "Tipo de pagamento inválido ou ausente" },
        { status: 400 }
      );
    }

    if (type === "pix") {
      // Usar AbacatePay para gerar PIX
      const pixData = await abacatepay.createPixQRCode({
        amount,
        description: "Compra na Sandro Adesivos",
        expiresIn: 30 // minutos
      });

      return NextResponse.json({
        transactionId: pixData.transactionId,
        pixCode: pixData.pixCode,
        qrCodeImage: pixData.qrCodeImage,
        expiresAt: pixData.expiresAt,
      });
    } else if (type === "secret") {
      // Criar cobrança no AbacatePay para cartão e boleto
      // Nota: Aqui estamos apenas simulando os segredos para manter a compatibilidade
      // Em uma implementação real, você usaria o AbacatePay para criar cobranças

      return NextResponse.json({
        card_client_secret: "abacate_card_" + uuidv4(),
        boleto_client_secret: "abacate_boleto_" + uuidv4(),
      });
    } else {
      return NextResponse.json(
        { message: "Tipo de pagamento inválido" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json(
      { message: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}