// server/storage.ts

import { InsertPixTransaction, PixTransaction } from "@/app/shared/schema";

// Interface IStorage
export interface IStorage {
  // Outros métodos existentes...

  // Métodos PIX
  createPixTransaction(pixTransaction: InsertPixTransaction): Promise<PixTransaction>;
  getPixTransaction(transactionId: string): Promise<PixTransaction | undefined>;
  updatePixTransactionStatus(transactionId: string, status: string): Promise<PixTransaction>;
}

// Implementação MemStorage
export class MemStorage implements IStorage {
  private pixTransactions: Map<string, PixTransaction>;

  constructor() {
    this.pixTransactions = new Map();
  }

  // Implementar métodos de PIX
  async createPixTransaction(pixTransaction: InsertPixTransaction): Promise<PixTransaction> {
    const now = new Date();
    const id = this.pixTransactions.size + 1;

    const newPixTransaction: PixTransaction = {
      id,
      transactionId: pixTransaction.transactionId,
      txid: pixTransaction.txid,
      pixCode: pixTransaction.pixCode,
      qrCode: pixTransaction.qrCode || null,
      value: String(pixTransaction.value), // Converter para string
      description: pixTransaction.description || null,
      status: pixTransaction.status || "PENDING",
      expiresAt: new Date(pixTransaction.expiresAt),
      createdAt: now,
      updatedAt: now,
      payerDetails: pixTransaction.payerDetails || null,
    };

    this.pixTransactions.set(pixTransaction.transactionId, newPixTransaction);
    return newPixTransaction;
  }

  async getPixTransaction(transactionId: string): Promise<PixTransaction | undefined> {
    return this.pixTransactions.get(transactionId);
  }

  async updatePixTransactionStatus(transactionId: string, status: string): Promise<PixTransaction> {
    const pixTransaction = this.pixTransactions.get(transactionId);

    if (!pixTransaction) {
      throw new Error(`PIX transaction with ID ${transactionId} not found`);
    }

    const updatedPixTransaction: PixTransaction = {
      ...pixTransaction,
      status,
      updatedAt: new Date(),
    };

    this.pixTransactions.set(transactionId, updatedPixTransaction);
    return updatedPixTransaction;
  }
}

// Exportar uma instância única de MemStorage
export const storage = new MemStorage();