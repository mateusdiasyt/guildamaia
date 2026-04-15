import { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import { z } from "zod";

const imageDataUrlRegex = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/;

export const createSupportTicketSchema = z.object({
  title: z.string().min(4, "Informe um titulo mais claro para o ticket.").max(120, "Titulo muito longo."),
  description: z
    .string()
    .min(10, "Descreva o problema ou pedido com mais detalhes.")
    .max(3000, "Descricao muito longa."),
  attachmentImage: z
    .string()
    .max(4_000_000, "Imagem muito longa.")
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || imageDataUrlRegex.test(value), "Imagem anexada invalida."),
  priority: z.nativeEnum(SupportTicketPriority),
});

export const updateSupportTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "Ticket obrigatorio."),
  status: z.nativeEnum(SupportTicketStatus),
});
