import { z } from "zod";

const decimalRegex = /^\d+([.,]\d{1,2})?$/;

export const upsertDailyGoalSchema = z.object({
  goalDate: z
    .string()
    .min(1, "Data da meta obrigatoria")
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), "Data da meta invalida"),
  entryTicketsTarget: z.coerce.number().int().min(0, "Meta de ingressos invalida"),
  consumptionSalesTarget: z.string().regex(decimalRegex, "Meta de consumacao invalida"),
  notes: z.string().max(280, "Observacao muito longa").optional().or(z.literal("")),
});
