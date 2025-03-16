// server/api/pix-payment.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { generatePixCode } from "@/app/api/payment/pix/pix";
import { storage } from "@/app/api/payment/pix/storage";
import { InsertPixTransaction } from "@/app/shared/schema";

// Gerar um novo pagamento PIX
export async function generatePixPayment(req: Request, res: Response) {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ message: "Valor inválido ou ausente" });
    }

    // Gerar IDs de transação
    const transactionId = uuidv4();
    const txid = uuidv4().replace(/-/g, "").substring(0, 32);

    // Gerar código PIXn
    const pixData = generatePixCode({
      merchantName: "55.696.475 SANDRO DOS SAN", // ALTERE PARA SEU NOME
      merchantCity: "SAO PAULO", // ALTERE PARA SUA CIDADE
      txid:"Uxg4Z67ACQVApAlcqzou2",
      amount,
      description: "Compra na Loja",
      pixKey: "59f7435a-b326-4cc2-9f68-f1b6be3c6d10", // ALTERE PARA SUA CHAVE PIX
    });

    // Gerar QR code
    const qrCode = await QRCode.toDataURL(pixData);

    // Calcular tempo de expiração (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Converter valor para formato aceito pelo schema
    const valueStr = amount.toString();
    const pixTransactionData: InsertPixTransaction = {
      transactionId,
      txid,
      pixCode: pixData,
      qrCode,
      value: valueStr, // Sem necessidade de `as any`
      description: "Compra na Loja",
      status: "PENDING",
      expiresAt,
      payerDetails: {},
    };
    // Armazenar no storage
    const pixTransaction = await storage.createPixTransaction(pixTransactionData);

    // Retornar dados para frontend
    return res.status(200).json({
      transactionId: pixTransaction.transactionId,
      pixCode: pixTransaction.pixCode,
      qrCodeImage: pixTransaction.qrCode,
      expiresAt: pixTransaction.expiresAt,
    });
  } catch (error) {
    console.error("Error generating PIX payment:", error);
    return res.status(500).json({ message: "Erro ao gerar pagamento PIX" });
  }
}

// Verificar status de um pagamento PIX
export async function checkPixPaymentStatus(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ message: "ID da transação é obrigatório" });
    }

    // Buscar transação no storage
    const pixTransaction = await storage.getPixTransaction(transactionId);

    if (!pixTransaction) {
      return res.status(404).json({ message: "Transação PIX não encontrada" });
    }

    return res.status(200).json({
      transactionId: pixTransaction.transactionId,
      status: pixTransaction.status,
      expiresAt: pixTransaction.expiresAt,
    });
  } catch (error) {
    console.error("Error checking PIX payment status:", error);
    return res.status(500).json({ message: "Erro ao verificar status do pagamento PIX" });
  }
}

// Webhook para atualizar o status de um pagamento PIX (simulado)
export async function updatePixPaymentStatus(req: Request, res: Response) {
  try {
    const { transactionId, status } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ message: "ID da transação e status são obrigatórios" });
    }

    // Atualizar status da transação
    const updatedTransaction = await storage.updatePixTransactionStatus(transactionId, status);

    return res.status(200).json({
      transactionId: updatedTransaction.transactionId,
      status: updatedTransaction.status,
    });
  } catch (error) {
    console.error("Error updating PIX payment status:", error);
    return res.status(500).json({ message: "Erro ao atualizar status do pagamento PIX" });
  }
}