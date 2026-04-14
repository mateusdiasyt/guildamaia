import { SupportTicketStatus } from "@prisma/client";

import { createSupportTicketSchema, updateSupportTicketStatusSchema } from "@/domain/support/schemas";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
} from "@/infrastructure/db/repositories/support-ticket-repository";

function createTicketNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-${datePart}-${randomPart}`;
}

export async function getSupportTickets(filters?: {
  search?: string;
  status?: SupportTicketStatus;
}) {
  return listSupportTickets(filters);
}

export async function createSupportTicketRecord(input: FormData, actor: { id?: string; name: string }) {
  const parsed = createSupportTicketSchema.parse({
    title: input.get("title"),
    description: input.get("description"),
    priority: input.get("priority"),
  });

  const created = await createSupportTicket({
    ticketNumber: createTicketNumber(),
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    priority: parsed.priority,
    createdById: actor.id,
    createdByName: actor.name,
  });

  await createAuditLog({
    userId: actor.id,
    action: "support.ticket.create",
    entity: "SupportTicket",
    entityId: created.id,
    metadata: {
      ticketNumber: created.ticketNumber,
      priority: created.priority,
      status: created.status,
    },
  });
}

export async function updateSupportTicketStatusRecord(input: FormData, actor: { id?: string; name: string }) {
  const parsed = updateSupportTicketStatusSchema.parse({
    ticketId: input.get("ticketId"),
    status: input.get("status"),
  });

  const updated = await updateSupportTicketStatus({
    ticketId: parsed.ticketId,
    status: parsed.status,
    updatedById: actor.id,
    updatedByName: actor.name,
  });

  await createAuditLog({
    userId: actor.id,
    action: "support.ticket.status.update",
    entity: "SupportTicket",
    entityId: updated.id,
    metadata: {
      ticketNumber: updated.ticketNumber,
      status: updated.status,
    },
  });
}
