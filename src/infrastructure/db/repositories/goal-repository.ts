import { Prisma, SaleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function normalizeGoalDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function normalizeMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getDaysInMonth(monthStart: Date) {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
}

export function parseGoalDateInput(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data da meta invalida.");
  }

  return normalizeGoalDate(parsed);
}

export function parseMonthReferenceInput(value: string) {
  const parsed = new Date(`${value}-01T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Mes de referencia invalido.");
  }

  return normalizeMonthStart(parsed);
}

export async function upsertDailyGoal(data: {
  goalDate: Date;
  entryTicketsTarget: number;
  consumptionSalesTarget: Prisma.Decimal;
  entryCategoryId?: string | null;
  consumptionCategoryId?: string | null;
  notes?: string;
  createdById?: string;
}) {
  const normalizedGoalDate = normalizeGoalDate(data.goalDate);

  return prisma.dailyGoal.upsert({
    where: {
      goalDate: normalizedGoalDate,
    },
    update: {
      entryTicketsTarget: data.entryTicketsTarget,
      consumptionSalesTarget: data.consumptionSalesTarget,
      entryCategoryId: data.entryCategoryId,
      consumptionCategoryId: data.consumptionCategoryId,
      notes: data.notes,
      createdById: data.createdById,
    },
    create: {
      goalDate: normalizedGoalDate,
      entryTicketsTarget: data.entryTicketsTarget,
      consumptionSalesTarget: data.consumptionSalesTarget,
      entryCategoryId: data.entryCategoryId,
      consumptionCategoryId: data.consumptionCategoryId,
      notes: data.notes,
      createdById: data.createdById,
    },
    include: {
      entryCategory: true,
      consumptionCategory: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function upsertMonthlyGoalPlan(data: {
  monthStart: Date;
  companyCost: Prisma.Decimal;
  desiredProfitPercent: Prisma.Decimal;
  createdById?: string;
}) {
  const normalizedMonthStart = normalizeMonthStart(data.monthStart);
  const daysInMonth = getDaysInMonth(normalizedMonthStart);
  const monthlyRevenueTarget = data.companyCost.times(data.desiredProfitPercent.div(100).plus(1)).toDecimalPlaces(2);
  const dailyRevenueTarget = monthlyRevenueTarget.div(daysInMonth).toDecimalPlaces(2);

  return prisma.monthlyGoalPlan.upsert({
    where: {
      monthStart: normalizedMonthStart,
    },
    update: {
      companyCost: data.companyCost,
      desiredProfitPercent: data.desiredProfitPercent,
      monthlyRevenueTarget,
      dailyRevenueTarget,
      createdById: data.createdById,
    },
    create: {
      monthStart: normalizedMonthStart,
      companyCost: data.companyCost,
      desiredProfitPercent: data.desiredProfitPercent,
      monthlyRevenueTarget,
      dailyRevenueTarget,
      createdById: data.createdById,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getDailyGoalByDate(goalDate: Date) {
  return prisma.dailyGoal.findUnique({
    where: {
      goalDate: normalizeGoalDate(goalDate),
    },
    include: {
      entryCategory: true,
      consumptionCategory: true,
    },
  });
}

export async function getMonthlyGoalPlanByDate(date: Date) {
  return prisma.monthlyGoalPlan.findUnique({
    where: {
      monthStart: normalizeMonthStart(date),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function listRecentDailyGoals(limit = 30) {
  return prisma.dailyGoal.findMany({
    include: {
      entryCategory: true,
      consumptionCategory: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      goalDate: "desc",
    },
    take: limit,
  });
}

export async function getDailyGoalProgress(data: {
  goalDate: Date;
  entryCategoryId?: string | null;
  consumptionCategoryId?: string | null;
}) {
  const start = normalizeGoalDate(data.goalDate);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [entryAggregate, consumptionAggregate] = await Promise.all([
    prisma.saleItem.aggregate({
      where: {
        sale: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        ...(data.entryCategoryId
          ? {
              product: {
                categoryId: data.entryCategoryId,
              },
            }
          : {}),
      },
      _sum: {
        quantity: true,
      },
    }),
    prisma.saleItem.aggregate({
      where: {
        sale: {
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        ...(data.consumptionCategoryId
          ? {
              product: {
                categoryId: data.consumptionCategoryId,
              },
            }
          : {}),
      },
      _sum: {
        lineTotal: true,
      },
    }),
  ]);

  return {
    entryTicketsActual: Number(entryAggregate._sum.quantity ?? 0),
    consumptionSalesActual: Number(consumptionAggregate._sum.lineTotal ?? 0),
  };
}
