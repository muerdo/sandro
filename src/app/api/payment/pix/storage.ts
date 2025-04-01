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
   private nextId: number; // Contador para IDs únicos
 
   constructor() {
     this.pixTransactions = new Map();
     this.nextId = 1; // Inicializa o contador de IDs
   }
 
   // Implementar métodos de PIX
   async createPixTransaction(pixTransaction: InsertPixTransaction): Promise<PixTransaction> {
     // Validação dos campos obrigatórios
     if (!pixTransaction.transactionId || !pixTransaction.txid || !pixTransaction.pixCode || !pixTransaction.value) {
       throw new Error("Campos obrigatórios (transactionId, txid, pixCode, value) não foram fornecidos.");
     }
 
     const now = new Date();
 
     // Cria uma nova transação PIX
     const newPixTransaction: PixTransaction = {
       id: this.nextId++, // Gera um ID único
       transactionId: pixTransaction.transactionId,
       txid: pixTransaction.txid,
       pixCode: pixTransaction.pixCode,
       qrCode: pixTransaction.qrCode || null,
       value: String(pixTransaction.value), // Converte para string (se necessário)
       description: pixTransaction.description || null,
       status: pixTransaction.status || "PENDING",
       expiresAt: pixTransaction.expiresAt ? new Date(pixTransaction.expiresAt) : new Date(now.getTime() + 30 * 60000), // 30 minutos padrão
       createdAt: now,
       updatedAt: now,
       payerDetails: pixTransaction.payerDetails || {}, // Usa um objeto vazio em vez de null
     };
 
     // Armazena a transação no Map
     this.pixTransactions.set(pixTransaction.transactionId, newPixTransaction);
     return newPixTransaction;
   }
 
   async getPixTransaction(transactionId: string): Promise<PixTransaction | undefined> {
     // Retorna a transação ou undefined se não existir
     return this.pixTransactions.get(transactionId);
   }
 
   async updatePixTransactionStatus(transactionId: string, status: string): Promise<PixTransaction> {
     // Busca a transação pelo ID
     const pixTransaction = this.pixTransactions.get(transactionId);
 
     if (!pixTransaction) {
       throw new Error(`Transação PIX com ID ${transactionId} não encontrada.`);
     }
 
     // Atualiza o status e a data de atualização
     const updatedPixTransaction: PixTransaction = {
       ...pixTransaction,
       status,
       updatedAt: new Date(),
     };
 
     // Atualiza o Map
     this.pixTransactions.set(transactionId, updatedPixTransaction);
     return updatedPixTransaction;
   }
 }
 
 // Exportar uma instância única de MemStorage
 export const storage = new MemStorage();