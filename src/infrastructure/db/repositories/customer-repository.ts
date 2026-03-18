import { CustomerDocumentType, RecordStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { documentNumber: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: {
          comandas: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function listCustomerOptions() {
  return prisma.customer.findMany({
    where: {
      status: RecordStatus.ACTIVE,
    },
    select: {
      id: true,
      fullName: true,
      documentType: true,
      documentNumber: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });
}

export async function findCustomerById(customerId: string) {
  return prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });
}

export async function createCustomer(data: {
  fullName: string;
  birthDate: Date;
  documentType: CustomerDocumentType;
  documentNumber: string;
  phone?: string;
  email?: string;
  status: RecordStatus;
}) {
  return prisma.customer.create({
    data,
  });
}

export async function updateCustomerStatus(data: { customerId: string; status: RecordStatus }) {
  return prisma.customer.update({
    where: {
      id: data.customerId,
    },
    data: {
      status: data.status,
    },
  });
}
