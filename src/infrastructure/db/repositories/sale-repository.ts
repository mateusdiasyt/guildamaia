import { CashSessionStatus, PaymentMethod, Prisma, RecordStatus, SaleStatus, StockMovementType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type SaleItemInput = {
  productId: string;
  quantity: number;
};

type SalePaymentInput = {
  method: PaymentMethod;
  amount: Prisma.Decimal;
};

export async function listPdvProductOptions() {
  return prisma.product.findMany({
    where: {
      status: RecordStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      salePrice: true,
      currentStock: true,
      status: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function listPdvOpenSessions() {
  return prisma.cashSession.findMany({
    where: {
      status: CashSessionStatus.OPEN,
    },
    include: {
      cashRegister: true,
      operator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
  });
}

export async function listRecentSales() {
  return prisma.sale.findMany({
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      cashSession: {
        include: {
          cashRegister: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
        },
      },
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function createSaleWithStockAdjustment(data: {
  saleNumber: string;
  cashSessionId: string;
  operatorId: string;
  customerName?: string;
  discountAmount: Prisma.Decimal;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.findUniqueOrThrow({
      where: { id: data.cashSessionId },
      select: {
        id: true,
        status: true,
      },
    });

    if (session.status !== CashSessionStatus.OPEN) {
      throw new Error("Sessao de caixa fechada. Abra um caixa para registrar venda.");
    }

    const productIds = [...new Set(data.items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        salePrice: true,
        costPrice: true,
        currentStock: true,
        status: true,
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const subtotalAmount = data.items.reduce((acc, item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("Produto nao encontrado para a venda.");
      }

      if (product.status !== RecordStatus.ACTIVE) {
        throw new Error(`Produto ${product.name} inativo para venda.`);
      }

      if (product.currentStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}.`);
      }

      return acc.plus(product.salePrice.times(item.quantity));
    }, new Prisma.Decimal(0));

    if (data.discountAmount.lessThan(0)) {
      throw new Error("Desconto invalido.");
    }

    if (data.discountAmount.greaterThan(subtotalAmount)) {
      throw new Error("Desconto nao pode ser maior que o subtotal da venda.");
    }

    const totalAmount = subtotalAmount.minus(data.discountAmount);
    const paymentsTotal = data.payments.reduce(
      (acc, payment) => acc.plus(payment.amount),
      new Prisma.Decimal(0),
    );

    const difference = paymentsTotal.minus(totalAmount).abs();
    if (difference.greaterThan(new Prisma.Decimal("0.01"))) {
      throw new Error("A soma dos pagamentos deve ser igual ao total liquido da venda.");
    }

    const sale = await tx.sale.create({
      data: {
        saleNumber: data.saleNumber,
        cashSessionId: data.cashSessionId,
        operatorId: data.operatorId,
        customerName: data.customerName,
        subtotalAmount,
        discountAmount: data.discountAmount,
        totalAmount,
        items: {
          create: data.items.map((item) => {
            const product = productMap.get(item.productId);
            if (!product) {
              throw new Error("Produto invalido na venda.");
            }

            return {
              productId: product.id,
              productNameSnapshot: product.name,
              skuSnapshot: product.sku,
              quantity: item.quantity,
              unitPrice: product.salePrice,
              unitCost: product.costPrice,
              lineTotal: product.salePrice.times(item.quantity),
              lineCostTotal: product.costPrice.times(item.quantity),
            };
          }),
        },
        payments: {
          create: data.payments.map((payment) => ({
            method: payment.method,
            amount: payment.amount,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        continue;
      }

      const resultingStock = product.currentStock - item.quantity;

      await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: resultingStock,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: StockMovementType.OUT,
          quantity: item.quantity,
          unitCost: product.costPrice,
          previousStock: product.currentStock,
          resultingStock,
          note: `Saida por venda ${data.saleNumber}`,
          operatorId: data.operatorId,
        },
      });
    }

    return sale;
  });
}

export async function cancelSaleAndRestock(data: {
  saleId: string;
  cancelReason: string;
  cancelledById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: data.saleId },
      include: {
        items: true,
      },
    });

    if (sale.status === SaleStatus.CANCELLED) {
      throw new Error("A venda selecionada ja foi cancelada.");
    }

    const productIds = [...new Set(sale.items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        currentStock: true,
        costPrice: true,
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: SaleStatus.CANCELLED,
        cancelReason: data.cancelReason,
        cancelledById: data.cancelledById,
        cancelledAt: new Date(),
      },
    });

    for (const item of sale.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        continue;
      }

      const resultingStock = product.currentStock + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: resultingStock,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.IN,
          quantity: item.quantity,
          unitCost: product.costPrice,
          previousStock: product.currentStock,
          resultingStock,
          note: `Retorno por cancelamento da venda ${sale.saleNumber}`,
          operatorId: data.cancelledById,
        },
      });
    }

    return sale;
  });
}
