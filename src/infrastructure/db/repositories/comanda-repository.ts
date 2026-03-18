import { ComandaStatus, PaymentMethod, Prisma, RecordStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createSaleWithStockAdjustmentInTransaction } from "@/infrastructure/db/repositories/sale-repository";

async function recalculateComandaSubtotal(tx: Prisma.TransactionClient, comandaId: string) {
  const aggregate = await tx.comandaItem.aggregate({
    where: {
      comandaId,
    },
    _sum: {
      lineTotal: true,
    },
  });

  const subtotalAmount = aggregate._sum.lineTotal ?? new Prisma.Decimal(0);

  await tx.comanda.update({
    where: {
      id: comandaId,
    },
    data: {
      subtotalAmount,
    },
  });
}

export async function listOpenComandas() {
  return prisma.comanda.findMany({
    where: {
      status: ComandaStatus.OPEN,
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          documentType: true,
          documentNumber: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              currentStock: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      openedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ number: "asc" }, { openedAt: "asc" }],
  });
}

export async function createComanda(data: {
  number: number;
  customerId?: string;
  isWalkIn: boolean;
  openedById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existingOpen = await tx.comanda.findFirst({
      where: {
        number: data.number,
        status: ComandaStatus.OPEN,
      },
      select: {
        id: true,
      },
    });

    if (existingOpen) {
      throw new Error(`Ja existe uma comanda aberta com o numero ${data.number}.`);
    }

    let customerNameSnapshot: string | undefined;
    if (data.customerId) {
      const customer = await tx.customer.findUnique({
        where: {
          id: data.customerId,
        },
        select: {
          id: true,
          fullName: true,
          status: true,
        },
      });

      if (!customer) {
        throw new Error("Cliente selecionado nao encontrado.");
      }

      if (customer.status !== RecordStatus.ACTIVE) {
        throw new Error("Cliente selecionado esta inativo.");
      }

      customerNameSnapshot = customer.fullName;
    }

    return tx.comanda.create({
      data: {
        number: data.number,
        status: ComandaStatus.OPEN,
        isWalkIn: data.isWalkIn,
        customerId: data.customerId,
        customerNameSnapshot,
        openedById: data.openedById,
      },
    });
  });
}

export async function addItemToComanda(data: {
  comandaId: string;
  productId: string;
  quantity: number;
}) {
  return prisma.$transaction(async (tx) => {
    const comanda = await tx.comanda.findUnique({
      where: {
        id: data.comandaId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!comanda || comanda.status !== ComandaStatus.OPEN) {
      throw new Error("A comanda selecionada nao esta aberta.");
    }

    const product = await tx.product.findUnique({
      where: {
        id: data.productId,
      },
      select: {
        id: true,
        name: true,
        salePrice: true,
        status: true,
      },
    });

    if (!product) {
      throw new Error("Produto nao encontrado.");
    }

    if (product.status !== RecordStatus.ACTIVE) {
      throw new Error(`Produto ${product.name} inativo para venda.`);
    }

    const existingItem = await tx.comandaItem.findUnique({
      where: {
        comandaId_productId: {
          comandaId: data.comandaId,
          productId: data.productId,
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    if (!existingItem) {
      await tx.comandaItem.create({
        data: {
          comandaId: data.comandaId,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: product.salePrice,
          lineTotal: product.salePrice.times(data.quantity),
        },
      });
    } else {
      const nextQuantity = existingItem.quantity + data.quantity;
      await tx.comandaItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: nextQuantity,
          unitPrice: product.salePrice,
          lineTotal: product.salePrice.times(nextQuantity),
        },
      });
    }

    await recalculateComandaSubtotal(tx, data.comandaId);
  });
}

export async function removeItemFromComanda(data: { comandaId: string; productId: string }) {
  return prisma.$transaction(async (tx) => {
    const comanda = await tx.comanda.findUnique({
      where: {
        id: data.comandaId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!comanda || comanda.status !== ComandaStatus.OPEN) {
      throw new Error("A comanda selecionada nao esta aberta.");
    }

    await tx.comandaItem.delete({
      where: {
        comandaId_productId: {
          comandaId: data.comandaId,
          productId: data.productId,
        },
      },
    });

    await recalculateComandaSubtotal(tx, data.comandaId);
  });
}

export async function closeComandaWithSale(data: {
  comandaId: string;
  cashSessionId: string;
  paymentMethod: PaymentMethod;
  discountAmount: Prisma.Decimal;
  operatorId: string;
  saleNumber: string;
}) {
  return prisma.$transaction(async (tx) => {
    const comanda = await tx.comanda.findUnique({
      where: {
        id: data.comandaId,
      },
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!comanda || comanda.status !== ComandaStatus.OPEN) {
      throw new Error("A comanda selecionada nao esta aberta.");
    }

    if (comanda.items.length === 0) {
      throw new Error("Adicione itens na comanda antes de fechar a venda.");
    }

    const productIds = [...new Set(comanda.items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        salePrice: true,
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const subtotalAmount = comanda.items.reduce((acc, item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("Produto da comanda nao encontrado.");
      }
      return acc.plus(product.salePrice.times(item.quantity));
    }, new Prisma.Decimal(0));

    if (data.discountAmount.lessThan(0)) {
      throw new Error("Desconto invalido.");
    }

    if (data.discountAmount.greaterThan(subtotalAmount)) {
      throw new Error("Desconto nao pode ser maior que o subtotal da comanda.");
    }

    const totalAmount = subtotalAmount.minus(data.discountAmount);

    const sale = await createSaleWithStockAdjustmentInTransaction(tx, {
      saleNumber: data.saleNumber,
      cashSessionId: data.cashSessionId,
      operatorId: data.operatorId,
      customerName: comanda.customer?.fullName ?? comanda.customerNameSnapshot ?? undefined,
      discountAmount: data.discountAmount,
      items: comanda.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      payments: [
        {
          method: data.paymentMethod,
          amount: totalAmount,
        },
      ],
    });

    await tx.comanda.update({
      where: {
        id: comanda.id,
      },
      data: {
        status: ComandaStatus.CLOSED,
        closedById: data.operatorId,
        closedAt: new Date(),
        closedSaleId: sale.id,
      },
    });

    return sale;
  });
}
