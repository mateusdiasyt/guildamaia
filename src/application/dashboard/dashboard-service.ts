import { Prisma, SaleStatus } from "@prisma/client";

import { countCategories } from "@/infrastructure/db/repositories/category-repository";
import { getDailyGoalByDate, getDailyGoalProgress } from "@/infrastructure/db/repositories/goal-repository";
import { countProducts, listLowStockProducts } from "@/infrastructure/db/repositories/product-repository";
import { prisma } from "@/lib/prisma";
import { countStockMovements } from "@/infrastructure/db/repositories/stock-repository";
import { countSuppliers } from "@/infrastructure/db/repositories/supplier-repository";
import { countUsers } from "@/infrastructure/db/repositories/user-repository";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toNumber(value: Prisma.Decimal | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value);
}

function growthPercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

function percentOfTarget(actual: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return (actual / target) * 100;
}

export async function getDashboardSummary() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const chartStart = new Date(todayStart);
  chartStart.setDate(chartStart.getDate() - 13);

  const [
    users,
    categories,
    suppliers,
    products,
    stockMovements,
    lowStockProducts,
    todayRevenueAggregate,
    yesterdayRevenueAggregate,
    todaySalesCount,
    yesterdaySalesCount,
    monthRevenueAggregate,
    previousMonthRevenueAggregate,
    recentSales,
    topProductsRaw,
    todayGoal,
  ] = await Promise.all([
    countUsers(),
    countCategories(),
    countSuppliers(),
    countProducts(),
    countStockMovements(),
    listLowStockProducts(),
    prisma.sale.aggregate({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.sale.aggregate({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.sale.count({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    prisma.sale.count({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
    }),
    prisma.sale.aggregate({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.sale.aggregate({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: prevMonthStart,
          lt: monthStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: chartStart,
          lt: tomorrowStart,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 6,
    }),
    getDailyGoalByDate(now),
  ]);

  const todayRevenue = toNumber(todayRevenueAggregate._sum.totalAmount);
  const yesterdayRevenue = toNumber(yesterdayRevenueAggregate._sum.totalAmount);
  const monthRevenue = toNumber(monthRevenueAggregate._sum.totalAmount);
  const previousMonthRevenue = toNumber(previousMonthRevenueAggregate._sum.totalAmount);

  const chartMap = new Map<string, { revenue: number; orders: number }>();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    chartMap.set(key, { revenue: 0, orders: 0 });
  }

  for (const sale of recentSales) {
    const key = startOfDay(sale.createdAt).toISOString().slice(0, 10);
    const item = chartMap.get(key);
    if (!item) {
      continue;
    }

    item.revenue += Number(sale.totalAmount);
    item.orders += 1;
  }

  const chart = Array.from(chartMap.entries()).map(([date, values]) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    revenue: Number(values.revenue.toFixed(2)),
    orders: values.orders,
  }));

  const topProductIds = topProductsRaw.map((item) => item.productId);
  const topProductRecords =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: topProductIds,
            },
          },
          select: {
            id: true,
            name: true,
            sku: true,
          },
        })
      : [];
  const productMap = new Map(topProductRecords.map((product) => [product.id, product]));

  const topProducts = topProductsRaw.map((item) => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      name: product?.name ?? "Produto removido",
      sku: product?.sku ?? "-",
      quantity: Number(item._sum.quantity ?? 0),
      revenue: Number(item._sum.lineTotal ?? 0),
    };
  });

  const todayGoalProgress = todayGoal
    ? await getDailyGoalProgress({
        goalDate: now,
        entryCategoryId: todayGoal.entryCategoryId,
        consumptionCategoryId: todayGoal.consumptionCategoryId,
      })
    : {
        entryTicketsActual: 0,
        consumptionSalesActual: 0,
      };

  const goal = todayGoal
    ? {
        id: todayGoal.id,
        goalDate: todayGoal.goalDate,
        entryTicketsTarget: todayGoal.entryTicketsTarget,
        consumptionSalesTarget: Number(todayGoal.consumptionSalesTarget),
        entryCategoryName: todayGoal.entryCategory?.name ?? null,
        consumptionCategoryName: todayGoal.consumptionCategory?.name ?? null,
        entryTicketsActual: todayGoalProgress.entryTicketsActual,
        consumptionSalesActual: todayGoalProgress.consumptionSalesActual,
        entryPercent: percentOfTarget(todayGoalProgress.entryTicketsActual, todayGoal.entryTicketsTarget),
        consumptionPercent: percentOfTarget(
          todayGoalProgress.consumptionSalesActual,
          Number(todayGoal.consumptionSalesTarget),
        ),
      }
    : null;

  return {
    users,
    categories,
    suppliers,
    products,
    stockMovements,
    lowStockProducts,
    todayRevenue,
    todaySalesCount,
    revenueGrowthPercent: growthPercent(todayRevenue, yesterdayRevenue),
    salesGrowthPercent: growthPercent(todaySalesCount, yesterdaySalesCount),
    monthRevenue,
    monthGrowthPercent: growthPercent(monthRevenue, previousMonthRevenue),
    chart,
    topProducts,
    goal,
  };
}
