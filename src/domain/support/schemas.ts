import { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import { z } from "zod";

export const createSupportTicketSchema = z.object({
  title: z.string().min(4, "Informe um titulo mais claro para o ticket.").max(120, "Titulo muito longo."),
  description: z
    .string()
    .min(10, "Descreva o problema ou pedido com mais detalhes.")
    .max(3000, "Descricao muito longa."),
  priority: z.nativeEnum(SupportTicketPriority),
});

export const updateSupportTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "Ticket obrigatorio."),
  status: z.nativeEnum(SupportTicketStatus),
});
