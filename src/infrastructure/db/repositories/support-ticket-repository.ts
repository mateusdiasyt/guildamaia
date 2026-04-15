import { Prisma, SupportTicketPriority, SupportTicketStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ListSupportTicketsFilters = {
  search?: string;
  status?: SupportTicketStatus;
};

export function isMissingSupportTicketTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" && String(error.meta?.table ?? "").includes("SupportTicket");
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("supportticket") && message.includes("does not exist");
  }

  return false;
}

export async function listSupportTickets(filters?: ListSupportTicketsFilters) {
  return prisma.supportTicket.findMany({
    where: {
      status: filters?.status,
      ...(filters?.search
        ? {
            OR: [
              { ticketNumber: { contains: filters.search, mode: "insensitive" } },
              { title: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
              { createdByName: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function createSupportTicket(data: {
  ticketNumber: string;
  title: string;
  description: string;
  attachmentImage?: string;
  priority: SupportTicketPriority;
  createdById?: string;
  createdByName: string;
}) {
  return prisma.supportTicket.create({
    data,
  });
}

export async function updateSupportTicketStatus(data: {
  ticketId: string;
  status: SupportTicketStatus;
  updatedById?: string;
  updatedByName?: string;
}) {
  return prisma.supportTicket.update({
    where: {
      id: data.ticketId,
    },
    data: {
      status: data.status,
      updatedById: data.updatedById,
      updatedByName: data.updatedByName,
      resolvedAt: data.status === SupportTicketStatus.RESOLVED ? new Date() : null,
    },
  });
}
