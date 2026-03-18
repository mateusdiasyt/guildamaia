import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

const decimalRegex = /^\d+([.,]\d{1,2})?$/;

export const createSaleSchema = z.object({
  cashSessionId: z.string().min(1, "Sessao de caixa obrigatoria"),
  customerName: z.string().max(120, "Nome do cliente muito longo").optional().or(z.literal("")),
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
