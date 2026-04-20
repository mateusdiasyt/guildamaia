import { Prisma, SaleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ReportPeriod = "daily" | "weekly";

type ReportRange = {
  start: Date;
  end: Date;
  label: string;
};

type ReportSummary = {
  salesCount: number;
  itemsCount: number;
  grossRevenue: number;
  netRevenue: number;
  discountAmount: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  roiOnCostPercent: number;
};

type ReportCategoryRow = {
  category: string;
  quantity: number;
  grossRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  roiOnCostPercent: number;
  profitSharePercent: number;
};

type ReportItemRow = {
  category: string;
  item: string;
  quantity: number;
  grossRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  roiOnCostPercent: number;
  profitSharePercent: number;
};

type ReportPeriodData = {
  period: ReportPeriod;
  label: string;
  range: ReportRange;
  summary: ReportSummary;
  categoryRows: ReportCategoryRow[];
  itemRows: ReportItemRow[];
};

type ReportsDataInput = {
  period?: string;
  date?: string;
};

type ReportsData = {
  referenceDate: string;
  selectedPeriod: ReportPeriod;
  active: ReportPeriodData;
  daily: ReportPeriodData;
  weekly: ReportPeriodData;
};

function toNumber(value: Prisma.Decimal | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return round2((value / total) * 100);
}

function toMarginPercent(grossProfit: number, grossRevenue: number) {
  if (grossRevenue <= 0) {
    return 0;
  }

  return round2((grossProfit / grossRevenue) * 100);
}

function toRoiPercent(grossProfit: number, totalCost: number) {
  if (totalCost <= 0) {
    return 0;
  }

  return round2((grossProfit / totalCost) * 100);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parseReferenceDate(value?: string) {
  if (!value) {
    return startOfDay(new Date());
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return startOfDay(new Date());
  }

  return startOfDay(parsed);
}

function getDailyRange(referenceDate: Date): ReportRange {
  const start = startOfDay(referenceDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
    label: `Dia ${formatDateLabel(start)}`,
  };
}

function getWeeklyRange(referenceDate: Date): ReportRange {
  const start = startOfDay(referenceDate);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);

  return {
    start,
    end,
    label: `${formatDateLabel(start)} ate ${formatDateLabel(lastDay)}`,
  };
}

async function getReportPeriodData(period: ReportPeriod, range: ReportRange): Promise<ReportPeriodData> {
  const [salesAggregate, salesCount, saleItems] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      _sum: {
        totalAmount: true,
        discountAmount: true,
      },
    }),
    prisma.sale.count({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
    }),
    prisma.saleItem.findMany({
      where: {
        sale: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: range.start,
            lt: range.end,
          },
        },
      },
      select: {
        productId: true,
        productNameSnapshot: true,
        quantity: true,
        lineTotal: true,
        lineCostTotal: true,
        product: {
          select: {
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let itemsCount = 0;
  let grossRevenue = 0;
  let totalCost = 0;

  const categoryMap = new Map<string, Omit<ReportCategoryRow, "profitSharePercent">>();
  const itemMap = new Map<string, Omit<ReportItemRow, "profitSharePercent">>();

  for (const saleItem of saleItems) {
    const quantity = saleItem.quantity;
    const lineRevenue = toNumber(saleItem.lineTotal);
    const lineCost = toNumber(saleItem.lineCostTotal);
    const lineProfit = lineRevenue - lineCost;
    const category = saleItem.product?.category?.name ?? "Sem categoria";
    const itemName = saleItem.product?.name ?? saleItem.productNameSnapshot ?? "Item removido";

    itemsCount += quantity;
    grossRevenue += lineRevenue;
    totalCost += lineCost;

    const categoryAccumulator = categoryMap.get(category) ?? {
      category,
      quantity: 0,
      grossRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      grossMarginPercent: 0,
      roiOnCostPercent: 0,
    };
    categoryAccumulator.quantity += quantity;
    categoryAccumulator.grossRevenue += lineRevenue;
    categoryAccumulator.totalCost += lineCost;
    categoryAccumulator.grossProfit += lineProfit;
    categoryMap.set(category, categoryAccumulator);

    const itemKey = `${category}::${itemName}`;
    const itemAccumulator = itemMap.get(itemKey) ?? {
      category,
      item: itemName,
      quantity: 0,
      grossRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      grossMarginPercent: 0,
      roiOnCostPercent: 0,
    };
    itemAccumulator.quantity += quantity;
    itemAccumulator.grossRevenue += lineRevenue;
    itemAccumulator.totalCost += lineCost;
    itemAccumulator.grossProfit += lineProfit;
    itemMap.set(itemKey, itemAccumulator);
  }

  const grossProfit = grossRevenue - totalCost;

  const categoryRows = Array.from(categoryMap.values())
    .map((row) => ({
      ...row,
      grossRevenue: round2(row.grossRevenue),
      totalCost: round2(row.totalCost),
      grossProfit: round2(row.grossProfit),
      grossMarginPercent: toMarginPercent(row.grossProfit, row.grossRevenue),
      roiOnCostPercent: toRoiPercent(row.grossProfit, row.totalCost),
      profitSharePercent: toPercent(row.grossProfit, grossProfit),
    }))
    .sort((a, b) => b.grossRevenue - a.grossRevenue);

  const itemRows = Array.from(itemMap.values())
    .map((row) => ({
      ...row,
      grossRevenue: round2(row.grossRevenue),
      totalCost: round2(row.totalCost),
      grossProfit: round2(row.grossProfit),
      grossMarginPercent: toMarginPercent(row.grossProfit, row.grossRevenue),
      roiOnCostPercent: toRoiPercent(row.grossProfit, row.totalCost),
      profitSharePercent: toPercent(row.grossProfit, grossProfit),
    }))
    .sort((a, b) => b.grossRevenue - a.grossRevenue);

  const summary: ReportSummary = {
    salesCount,
    itemsCount,
    grossRevenue: round2(grossRevenue),
    netRevenue: round2(toNumber(salesAggregate._sum.totalAmount)),
    discountAmount: round2(toNumber(salesAggregate._sum.discountAmount)),
    totalCost: round2(totalCost),
    grossProfit: round2(grossProfit),
    grossMarginPercent: toMarginPercent(grossProfit, grossRevenue),
    roiOnCostPercent: toRoiPercent(grossProfit, totalCost),
  };

  return {
    period,
    label: period === "daily" ? "Relatorio diario" : "Relatorio semanal",
    range,
    summary,
    categoryRows,
    itemRows,
  };
}

export async function getReportsData(input: ReportsDataInput): Promise<ReportsData> {
  const selectedPeriod: ReportPeriod = input.period === "weekly" ? "weekly" : "daily";
  const referenceDate = parseReferenceDate(input.date);
  const dailyRange = getDailyRange(referenceDate);
  const weeklyRange = getWeeklyRange(referenceDate);

  const [daily, weekly] = await Promise.all([
    getReportPeriodData("daily", dailyRange),
    getReportPeriodData("weekly", weeklyRange),
  ]);

  return {
    referenceDate: referenceDate.toISOString().slice(0, 10),
    selectedPeriod,
    active: selectedPeriod === "weekly" ? weekly : daily,
    daily,
    weekly,
  };
}
