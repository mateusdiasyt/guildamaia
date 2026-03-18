import { RecordStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listUsers(search?: string) {
  return prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      role: true,
      unit: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function listRoles() {
  return prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
  status: RecordStatus;
  unitId?: string;
}) {
  return prisma.user.create({
    data,
  });
}

export async function updateUserStatus(data: { userId: string; status: RecordStatus }) {
  return prisma.user.update({
    where: { id: data.userId },
    data: { status: data.status },
  });
}

export async function countUsers() {
  return prisma.user.count();
}
