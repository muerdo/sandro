import { pgTable, text, serial, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schemas de validação para campos JSONB
const payerDetailsSchema = z.object({
  name: z.string(),
  document: z.string(),
  email: z.string().email(),
});

const shippingAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

const itemSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
  price: z.number(),
});

// Enum para status
const statusEnum = z.enum(["PENDING", "COMPLETED", "EXPIRED"]);

// Tabela de usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Tabela de transações PIX
export const pixTransactions = pgTable("pix_transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  txid: text("txid").notNull().unique(),
  pixCode: text("pix_code").notNull(),
  qrCode: text("qr_code"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: text("status").notNull().default("PENDING"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  payerDetails: jsonb("payer_details"),
});

// Tabela de pedidos
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  items: jsonb("items").notNull(),
});

// Schemas de inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Schema de inserção para transações PIX
export const insertPixTransactionSchema = z.object({
  transactionId: z.string(),
  txid: z.string(),
  pixCode: z.string(),
  qrCode: z.string().optional(),
  value: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Value must be a positive number",
  }),
  description: z.string().optional(),
  status: statusEnum.default("PENDING"),
  expiresAt: z.string().datetime(), // Aceita uma string no formato ISO 8601
  payerDetails: payerDetailsSchema.optional(),
});

// Schema de inserção para pedidos
export const insertOrderSchema = z.object({
  userId: z.number(),
  total: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Total must be a positive number",
  }),
  status: z.string().default("pending"),
  paymentMethod: z.string(),
  paymentId: z.string().optional(),
  shippingAddress: shippingAddressSchema,
  items: z.array(itemSchema),
});

// Tipos inferidos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPixTransaction = z.infer<typeof insertPixTransactionSchema>;
export type PixTransaction = typeof pixTransactions.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;