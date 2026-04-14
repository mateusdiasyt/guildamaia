import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type CreateAuditLogInput = {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function listCashAuditLogs(limit = 250) {
  return prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { startsWith: "cash." } },
        { action: { startsWith: "pdv." } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
