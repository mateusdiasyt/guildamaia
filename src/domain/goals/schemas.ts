import { z } from "zod";

const decimalRegex = /^\d+([.,]\d{1,2})?$/;

export const upsertDailyGoalSchema = z.object({
  goalDate: z
    .string()
    .min(1, "Data da meta obrigatoria")
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), "Data da meta invalida"),
  notes: z.string().max(280, "Observacao muito longa").optional().or(z.literal("")),
});

export const upsertMonthlyGoalPlanSchema = z.object({
  monthReference: z
    .string()
    .min(1, "Mes de referencia obrigatorio")
    .regex(/^\d{4}-\d{2}$/, "Mes de referencia invalido"),
  companyCost: z.string().regex(decimalRegex, "Custo da empresa invalido"),
  desiredProfitPercent: z.string().regex(decimalRegex, "Percentual de lucro invalido"),
});
