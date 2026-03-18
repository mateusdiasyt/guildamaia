import { RecordStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listCategories(search?: string) {
  return prisma.productCategory.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
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

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  status: RecordStatus;
}) {
  return prisma.productCategory.create({
    data,
  });
}

export async function countCategories() {
  return prisma.productCategory.count();
}

export async function listCategoryOptions() {
  return prisma.productCategory.findMany({
    where: {
      status: RecordStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function updateCategoryStatus(data: { categoryId: string; status: RecordStatus }) {
  return prisma.productCategory.update({
    where: { id: data.categoryId },
    data: { status: data.status },
  });
}
