import { RecordStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listSuppliers(search?: string) {
  return prisma.supplier.findMany({
    where: search
      ? {
          OR: [
            { tradeName: { contains: search, mode: "insensitive" } },
            { legalName: { contains: search, mode: "insensitive" } },
            { document: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createSupplier(data: {
  tradeName: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  status: RecordStatus;
}) {
  return prisma.supplier.create({
    data,
  });
}

export async function countSuppliers() {
  return prisma.supplier.count();
}

export async function listSupplierOptions() {
  return prisma.supplier.findMany({
    where: {
      status: RecordStatus.ACTIVE,
    },
    select: {
      id: true,
      tradeName: true,
    },
    orderBy: {
      tradeName: "asc",
    },
  });
}

export async function updateSupplierStatus(data: { supplierId: string; status: RecordStatus }) {
  return prisma.supplier.update({
    where: { id: data.supplierId },
    data: { status: data.status },
  });
}
