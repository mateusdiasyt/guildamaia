import { z } from "zod";

export const createSystemUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Informe um titulo com pelo menos 3 caracteres.")
    .max(120, "Titulo muito longo."),
  description: z
    .string()
    .trim()
    .min(8, "Descreva a atualizacao com mais detalhes.")
    .max(2400, "Descricao muito longa."),
});

export type CreateSystemUpdateInput = z.infer<typeof createSystemUpdateSchema>;
