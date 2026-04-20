import { Prisma, SaleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const REPORT_PERIODS = [
  "1d",
  "7d",
  "30d",
  "3m",
  "6m",
  "1y",
  "custom",
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

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
  startDate?: string;
  endDate?: string;
};

type ReportsData = {
  referenceDate: string;
  customStartDate: string;
  customEndDate: string;
  selectedPeriod: ReportPeriod;
  active: ReportPeriodData;
  oneDay: ReportPeriodData;
  sevenDays: ReportPeriodData;
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

function endExclusiveOfDay(date: Date) {
  const end = startOfDay(date);
  end.setDate(end.getDate() + 1);
  return end;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parseDateInput(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return startOfDay(parsed);
}

function parseReferenceDate(value?: string) {
  return parseDateInput(value) ?? startOfDay(new Date());
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function resolvePeriod(period?: string): ReportPeriod {
  if (!period) {
    return "1d";
  }

  if ((REPORT_PERIODS as readonly string[]).includes(period)) {
    return period as ReportPeriod;
  }

  return "1d";
}

function getTrailingDaysRange(referenceDate: Date, days: number, label: string): ReportRange {
  const end = endExclusiveOfDay(referenceDate);
  const start = startOfDay(referenceDate);
  start.setDate(start.getDate() - (days - 1));

  return {
    start,
    end,
    label: `${label}: ${formatDateLabel(start)} ate ${formatDateLabel(referenceDate)}`,
  };
}

function getTrailingMonthsRange(referenceDate: Date, months: number, label: string): ReportRange {
  const end = endExclusiveOfDay(referenceDate);
  const start = startOfDay(referenceDate);
  start.setMonth(start.getMonth() - months);
  start.setDate(start.getDate() + 1);

  return {
    start,
    end,
    label: `${label}: ${formatDateLabel(start)} ate ${formatDateLabel(referenceDate)}`,
  };
}

function getCustomRange(startDateInput?: string, endDateInput?: string) {
  const today = startOfDay(new Date());
  const parsedStart = parseDateInput(startDateInput);
  const parsedEnd = parseDateInput(endDateInput);

  const fallbackStart = parsedStart ?? parsedEnd ?? today;
  const fallbackEnd = parsedEnd ?? parsedStart ?? today;

  let start = fallbackStart;
  let end = fallbackEnd;

  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  return {
    range: {
      start,
      end: endExclusiveOfDay(end),
      label: `Personalizado: ${formatDateLabel(start)} ate ${formatDateLabel(end)}`,
    },
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function getRangeForPeriod(
  period: ReportPeriod,
  referenceDate: Date,
  customStartDate?: string,
  customEndDate?: string,
) {
  switch (period) {
    case "1d":
      return {
        range: getTrailingDaysRange(referenceDate, 1, "Periodo de 1 dia"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
    case "7d":
      return {
        range: getTrailingDaysRange(referenceDate, 7, "Periodo de 7 dias"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
    case "30d":
      return {
        range: getTrailingDaysRange(referenceDate, 30, "Periodo de 30 dias"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
    case "3m":
      return {
        range: getTrailingMonthsRange(referenceDate, 3, "Periodo de 3 meses"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
    case "6m":
      return {
        range: getTrailingMonthsRange(referenceDate, 6, "Periodo de 6 meses"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
    case "1y":
      return {
        range: getTrailingMonthsRange(referenceDate, 12, "Periodo de 1 ano"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
    case "custom": {
      const custom = getCustomRange(customStartDate, customEndDate);
      return {
        range: custom.range,
        customStartDate: custom.startDate,
        customEndDate: custom.endDate,
      };
    }
    default:
      return {
        range: getTrailingDaysRange(referenceDate, 1, "Periodo de 1 dia"),
        customStartDate: customStartDate ?? toDateInputValue(referenceDate),
        customEndDate: customEndDate ?? toDateInputValue(referenceDate),
      };
  }
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
    label:
      period === "1d"
        ? "Relatorio de 1 dia"
        : period === "7d"
          ? "Relatorio de 7 dias"
          : period === "30d"
            ? "Relatorio de 30 dias"
            : period === "3m"
              ? "Relatorio de 3 meses"
              : period === "6m"
                ? "Relatorio de 6 meses"
                : period === "1y"
                  ? "Relatorio de 1 ano"
                  : "Relatorio personalizado",
    range,
    summary,
    categoryRows,
    itemRows,
  };
}

export async function getReportsData(input: ReportsDataInput): Promise<ReportsData> {
  const selectedPeriod = resolvePeriod(input.period);
  const referenceDate = parseReferenceDate(input.date);

  const oneDayRange = getRangeForPeriod("1d", referenceDate, input.startDate, input.endDate).range;
  const sevenDaysRange = getRangeForPeriod("7d", referenceDate, input.startDate, input.endDate).range;
  const selectedRangeData = getRangeForPeriod(selectedPeriod, referenceDate, input.startDate, input.endDate);

  const [oneDay, sevenDays, active] = await Promise.all([
    getReportPeriodData("1d", oneDayRange),
    getReportPeriodData("7d", sevenDaysRange),
    getReportPeriodData(selectedPeriod, selectedRangeData.range),
  ]);

  return {
    referenceDate: toDateInputValue(referenceDate),
    customStartDate: selectedRangeData.customStartDate,
    customEndDate: selectedRangeData.customEndDate,
    selectedPeriod,
    active,
    oneDay,
    sevenDays,
  };
}
