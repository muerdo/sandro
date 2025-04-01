import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { generatePixCode } from "@/app/api/payment/pix/pix";
import { storage } from "@/app/api/payment/pix/storage";
import { InsertPixTransaction } from "@/app/shared/schema";

/**
 * Gera um novo pagamento PIX.
 * @param req - Requisição HTTP contendo amount, description e pixKey no body.
 * @param res - Resposta HTTP.
 */
export async function generatePixPayment(req: Request, res: Response) {
  try {
    const { amount, description, pixKey } = req.body;

    // Validação dos campos
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Valor inválido ou ausente" });
    }

    if (!pixKey || typeof pixKey !== "string") {
      return res.status(400).json({ message: "Chave PIX inválida ou ausente" });
    }

    // Gerar IDs de transação
    const transactionId = uuidv4();
    const txid = uuidv4().replace(/-/g, "").substring(0, 32);

    // Gerar código PIX
    const pixData = generatePixCode({
      merchantName: "55.696.475 SANDRO DOS SAN", // ALTERE PARA SEU NOME
      merchantCity: "SAO PAULO", // ALTERE PARA SUA CIDADE
      txid: txid, // Usar o txid gerado
      amount,
      description: description || "Compra na Loja",
      pixKey: pixKey, // Usar a chave PIX fornecida
    });

    // Gerar QR code
    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(pixData);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      return res.status(500).json({ message: "Erro ao gerar QR Code" });
    }

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
      value: valueStr,
      description: description || "Compra na Loja",
      status: "PENDING",
      expiresAt,
      payerDetails: {},
    };

    // Armazenar no storage
    const pixTransaction = await storage.createPixTransaction(pixTransactionData);

    if (!pixTransaction) {
      return res.status(500).json({ message: "Erro ao salvar transação PIX" });
    }

    // Retornar dados para o frontend
    return res.status(200).json({
      transactionId: pixTransaction.transactionId,
      pixCode: pixTransaction.pixCode,
      qrCodeImage: pixTransaction.qrCode,
      expiresAt: pixTransaction.expiresAt,
    });
  } catch (error) {
    console.error("Erro ao gerar pagamento PIX:", error);
    return res.status(500).json({ message: "Erro ao gerar pagamento PIX" });
  }
}

/**
 * Verifica o status de um pagamento PIX.
 * @param req - Requisição HTTP contendo transactionId nos parâmetros.
 * @param res - Resposta HTTP.
 */
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
    console.error("Erro ao verificar status do pagamento PIX:", error);
    return res.status(500).json({ message: "Erro ao verificar status do pagamento PIX" });
  }
}

/**
 * Atualiza o status de um pagamento PIX (simulado via webhook).
 * @param req - Requisição HTTP contendo transactionId e status no body.
 * @param res - Resposta HTTP.
 */
export async function updatePixPaymentStatus(req: Request, res: Response) {
  try {
    const { transactionId, status } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ message: "ID da transação e status são obrigatórios" });
    }

    const validStatuses = ["PENDING", "COMPLETED", "EXPIRED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    // Atualizar status da transação
    const updatedTransaction = await storage.updatePixTransactionStatus(transactionId, status);

    if (!updatedTransaction) {
      return res.status(500).json({ message: "Erro ao atualizar status da transação" });
    }

    return res.status(200).json({
      transactionId: updatedTransaction.transactionId,
      status: updatedTransaction.status,
    });
  } catch (error) {
    console.error("Erro ao atualizar status do pagamento PIX:", error);
    return res.status(500).json({ message: "Erro ao atualizar status do pagamento PIX" });
  }
}

/**
 * Confirma manualmente um pagamento PIX.
 * @param req - Requisição HTTP contendo transactionId nos parâmetros.
 * @param res - Resposta HTTP.
 */
export async function confirmPixPayment(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ message: "ID da transação é obrigatório" });
    }

    // Atualizar status da transação para "COMPLETED"
    const updatedTransaction = await storage.updatePixTransactionStatus(transactionId, "COMPLETED");

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transação PIX não encontrada" });
    }

    return res.status(200).json({
      transactionId: updatedTransaction.transactionId,
      status: updatedTransaction.status,
    });
  } catch (error) {
    console.error("Erro ao confirmar pagamento PIX:", error);
    return res.status(500).json({ message: "Erro ao confirmar pagamento PIX" });
  }
}