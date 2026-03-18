import { z } from "zod";

const decimalRegex = /^\d+([.,]\d{1,2})?$/;

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().min(1, "Caixa obrigatorio"),
  openingAmount: z.string().regex(decimalRegex, "Valor de abertura invalido"),
  note: z.string().max(280, "Observacao muito longa").optional().or(z.literal("")),
});

export const registerCashWithdrawalSchema = z.object({
  cashSessionId: z.string().min(1, "Sessao de caixa obrigatoria"),
  amount: z.string().regex(decimalRegex, "Valor de sangria invalido"),
  reason: z.string().min(3, "Motivo obrigatorio").max(180, "Motivo muito longo"),
});

export const closeCashSessionSchema = z.object({
  cashSessionId: z.string().min(1, "Sessao de caixa obrigatoria"),
  closingAmount: z.string().regex(decimalRegex, "Valor de fechamento invalido"),
  note: z.string().max(280, "Observacao muito longa").optional().or(z.literal("")),
});
