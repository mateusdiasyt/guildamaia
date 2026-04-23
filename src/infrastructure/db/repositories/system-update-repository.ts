import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function isMissingSystemUpdateTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" && String(error.meta?.table ?? "").includes("SystemUpdate");
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    return normalizedMessage.includes("systemupdate") && normalizedMessage.includes("does not exist");
  }

  return false;
}

export async function listSystemUpdates() {
  return prisma.systemUpdate.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function createSystemUpdate(data: {
  title: string;
  description: string;
  createdById?: string;
  createdByName: string;
}) {
  return prisma.systemUpdate.create({
    data,
  });
}
