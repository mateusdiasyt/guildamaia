import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

const decimalRegex = /^\d+([.,]\d{1,2})?$/;

export const createSaleSchema = z.object({
  cashSessionId: z.string().min(1, "Sessao de caixa obrigatoria"),
  customerName: z.string().max(120, "Nome do cliente muito longo").optional().or(z.literal("")),
  discountAmount: z.string().regex(decimalRegex, "Desconto invalido"),
});

export const createComandaSchema = z.object({
  number: z.coerce.number().int().min(0, "Numero da comanda invalido").max(200, "Numero maximo da comanda: 200"),
  customerId: z.string().optional().or(z.literal("")),
  isWalkIn: z.coerce.boolean().default(false),
});

export const addComandaItemSchema = z.object({
  comandaId: z.string().min(1, "Comanda obrigatoria"),
  productId: z.string().min(1, "Produto obrigatorio"),
  quantity: z.coerce.number().int().positive("Quantidade invalida"),
});

export const removeComandaItemSchema = z.object({
  comandaId: z.string().min(1, "Comanda obrigatoria"),
  productId: z.string().min(1, "Produto obrigatorio"),
});

export const closeComandaSchema = z.object({
  comandaId: z.string().min(1, "Comanda obrigatoria"),
  cashSessionId: z.string().min(1, "Sessao de caixa obrigatoria"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  discountAmount: z.string().regex(decimalRegex, "Desconto invalido"),
});

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Produto obrigatorio"),
  quantity: z.number().int().positive("Quantidade invalida"),
});

export const salePaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.string().regex(decimalRegex, "Valor de pagamento invalido"),
});

export const cancelSaleSchema = z.object({
  saleId: z.string().min(1, "Venda obrigatoria"),
  cancelReason: z.string().min(3, "Informe o motivo do cancelamento").max(280, "Motivo muito longo"),
});
