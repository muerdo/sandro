// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { generatePixCode } from "@/app/api/payment/pix/pix";
import { storage } from "@/app/api/payment/pix/storage";
import { InsertPixTransaction } from "@/app/shared/schema";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, type } = body;

    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { message: "Valor inválido ou ausente" },
        { status: 400 }
      );
    }
    

    if (type === "pix") {
      // Lógica para gerar PIX
      const transactionId = uuidv4();
      const txid = uuidv4().replace(/-/g, "").substring(0, 32);

      const pixData = generatePixCode({
        merchantName: "55.696.475 SANDRO DOS SAN",
        merchantCity: "SAO PAULO",
        txid:"Uxg4Z67ACQVApAlcqzou2",
        amount,
        postalCode: "05409000",
        description: "Compra na Loja",
        pixKey: "59f7435a-b326-4cc2-9f68-f1b6be3c6d10",
      });

      const qrCode = await QRCode.toDataURL(pixData);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const valueStr = amount.toString();

      const pixTransactionData: InsertPixTransaction = {
        transactionId,
        txid,
        pixCode: pixData,
        qrCode,
        value: valueStr,
        description: "Compra na Loja",
        status: "PENDING",
        expiresAt,
        payerDetails: {},
      };

      const pixTransaction = await storage.createPixTransaction(pixTransactionData);

      return NextResponse.json({
        transactionId: pixTransaction.transactionId,
        pixCode: pixTransaction.pixCode,
        qrCodeImage: pixTransaction.qrCode,
        expiresAt: pixTransaction.expiresAt,
      });
    } else if (type === "secret") {
      // Lógica para gerar segredos do Stripe (cartão e boleto)
      const cardPaymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Valor em centavos
        currency: "brl", // Moeda: Real Brasileiro
        payment_method_types: ["card"], // Método de pagamento: Cartão
      });

      const boletoPaymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Valor em centavos
        currency: "brl", // Moeda: Real Brasileiro
        payment_method_types: ["boleto"], // Método de pagamento: Boleto
      });

      return NextResponse.json({
        card_client_secret: cardPaymentIntent.client_secret,
        boleto_client_secret: boletoPaymentIntent.client_secret,
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