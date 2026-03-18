import { Prisma, RecordStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listProducts(search?: string) {
  return prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      category: true,
      supplier: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createProduct(data: {
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  costPrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;
  marginPercent: Prisma.Decimal;
  minStock: number;
  currentStock: number;
  status: RecordStatus;
}) {
  return prisma.product.create({
    data,
  });
}

export async function countProducts() {
  return prisma.product.count();
}

export async function listProductOptions() {
  return prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      status: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function listLowStockProducts() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      minStock: true,
    },
  });

  return products
    .filter((product) => product.currentStock <= product.minStock)
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 5);
}

export async function updateProductStatus(data: { productId: string; status: RecordStatus }) {
  return prisma.product.update({
    where: { id: data.productId },
    data: { status: data.status },
  });
}
