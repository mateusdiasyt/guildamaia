import { Prisma, StockMovementType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type RegisterStockMovementInput = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: Prisma.Decimal;
  note?: string;
  operatorId?: string;
};

export async function listStockMovements() {
  return prisma.stockMovement.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
      operator: {
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
    take: 100,
  });
}

export async function registerStockMovement(data: RegisterStockMovementInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: data.productId },
      select: {
        id: true,
        currentStock: true,
      },
    });

    let resultingStock = product.currentStock;

    if (data.type === StockMovementType.IN) {
      resultingStock += data.quantity;
    } else if (data.type === StockMovementType.OUT) {
      resultingStock -= data.quantity;
      if (resultingStock < 0) {
        throw new Error("Estoque insuficiente para a saida selecionada.");
      }
    } else {
      resultingStock = data.quantity;
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost,
        previousStock: product.currentStock,
        resultingStock,
        note: data.note,
        operatorId: data.operatorId,
      },
    });

    const stockUpdate = await tx.product.updateMany({
      where: { id: product.id },
      data: {
        currentStock: resultingStock,
      },
    });

    if (stockUpdate.count === 0) {
      throw new Error("Produto nao encontrado para atualizar o estoque.");
    }

    return movement;
  });
}

export async function countStockMovements() {
  return prisma.stockMovement.count();
}
