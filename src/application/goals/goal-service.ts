import { SaleStatus } from "@prisma/client";

import { upsertDailyGoalSchema, upsertMonthlyGoalPlanSchema } from "@/domain/goals/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import {
  getDailyGoalByDate,
  getDailyGoalProgress,
  getMonthlyGoalPlanByDate,
  listRecentDailyGoals,
  parseGoalDateInput,
  parseMonthReferenceInput,
  upsertDailyGoal,
  upsertMonthlyGoalPlan,
} from "@/infrastructure/db/repositories/goal-repository";
import { parseDecimalInput } from "@/lib/decimal";
import { prisma } from "@/lib/prisma";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthInputValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function nextMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function percentOfTarget(actual: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return (actual / target) * 100;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getDaysInMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

export async function getGoalsPageData() {
  const now = new Date();
  const currentMonthStart = monthStart(now);
  const currentNextMonthStart = nextMonthStart(now);

  const [todayGoal, recentGoals, monthlyPlan, monthRevenueAggregate, todayProgress] = await Promise.all([
    getDailyGoalByDate(now),
    listRecentDailyGoals(20),
    getMonthlyGoalPlanByDate(now),
    prisma.sale.aggregate({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: currentMonthStart,
          lt: currentNextMonthStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    getDailyGoalProgress({
      goalDate: now,
    }),
  ]);

  const goalsWithProgress = await Promise.all(
    recentGoals.map(async (goal) => {
      const progress = await getDailyGoalProgress({
        goalDate: goal.goalDate,
      });

      return {
        id: goal.id,
        goalDate: goal.goalDate,
        revenueTarget: Number(goal.consumptionSalesTarget),
        revenueActual: progress.revenueActual,
        notes: goal.notes,
      };
    }),
  );

  const monthRevenueActual = Number(monthRevenueAggregate._sum.totalAmount ?? 0);
  const totalDaysInCurrentMonth = getDaysInMonth(now);
  const elapsedDaysInCurrentMonth = Math.min(now.getUTCDate(), totalDaysInCurrentMonth);

  return {
    todayGoal,
    todaySummary: monthlyPlan
      ? {
          goalDate: toDateInputValue(now),
          revenueTarget: Number(monthlyPlan.dailyRevenueTarget),
          revenueActual: todayProgress.revenueActual,
          dailyBalance: roundCurrency(todayProgress.revenueActual - Number(monthlyPlan.dailyRevenueTarget)),
          dailyPercent: percentOfTarget(todayProgress.revenueActual, Number(monthlyPlan.dailyRevenueTarget)),
        }
      : null,
    todayDefaultGoalDate: toDateInputValue(now),
    goals: goalsWithProgress,
    currentMonthReference: toMonthInputValue(currentMonthStart),
    monthlyPlan: monthlyPlan
      ? {
          id: monthlyPlan.id,
          monthStart: monthlyPlan.monthStart,
          companyCost: Number(monthlyPlan.companyCost),
          desiredProfitPercent: Number(monthlyPlan.desiredProfitPercent),
          monthlyRevenueTarget: Number(monthlyPlan.monthlyRevenueTarget),
          dailyRevenueTarget: Number(monthlyPlan.dailyRevenueTarget),
          monthRevenueActual,
          expectedRevenueToDate: roundCurrency(Number(monthlyPlan.dailyRevenueTarget) * elapsedDaysInCurrentMonth),
          elapsedDaysInCurrentMonth,
          totalDaysInCurrentMonth,
          remainingDaysInCurrentMonth: Math.max(totalDaysInCurrentMonth - elapsedDaysInCurrentMonth, 0),
          balanceToDate: roundCurrency(
            monthRevenueActual - Number(monthlyPlan.dailyRevenueTarget) * elapsedDaysInCurrentMonth,
          ),
          remainingRevenueToTarget: roundCurrency(Number(monthlyPlan.monthlyRevenueTarget) - monthRevenueActual),
          recommendedDailyTarget: roundCurrency(
            Math.max(totalDaysInCurrentMonth - elapsedDaysInCurrentMonth, 0) > 0
              ? Math.max(Number(monthlyPlan.monthlyRevenueTarget) - monthRevenueActual, 0) /
                  Math.max(totalDaysInCurrentMonth - elapsedDaysInCurrentMonth, 1)
              : 0,
          ),
          monthRevenuePercent: percentOfTarget(monthRevenueActual, Number(monthlyPlan.monthlyRevenueTarget)),
        }
      : null,
  };
}

export async function upsertMonthlyGoalPlanRecord(input: FormData, actorId: string) {
  const parsed = upsertMonthlyGoalPlanSchema.parse({
    monthReference: input.get("monthReference"),
    companyCost: input.get("companyCost"),
    desiredProfitPercent: input.get("desiredProfitPercent"),
  });

  const companyCost = parseDecimalInput(parsed.companyCost);
  const desiredProfitPercent = parseDecimalInput(parsed.desiredProfitPercent);

  if (companyCost.lessThanOrEqualTo(0)) {
    throw new Error("Custo da empresa deve ser maior que zero.");
  }

  if (desiredProfitPercent.lessThan(0)) {
    throw new Error("Percentual de lucro deve ser maior ou igual a zero.");
  }

  if (desiredProfitPercent.greaterThan(1000)) {
    throw new Error("Percentual de lucro muito alto para calculo.");
  }

  return upsertMonthlyGoalPlan({
    monthStart: parseMonthReferenceInput(parsed.monthReference),
    companyCost,
    desiredProfitPercent,
    createdById: actorId,
  });
}

export async function upsertDailyGoalRecord(input: FormData, actorId: string) {
  const parsed = upsertDailyGoalSchema.parse({
    goalDate: input.get("goalDate"),
    notes: input.get("notes"),
  });

  const goalDate = parseGoalDateInput(parsed.goalDate);
  const monthPlan = await getMonthlyGoalPlanByDate(goalDate);

  if (!monthPlan) {
    throw new Error("Configure o planejamento mensal (custo + lucro) antes de salvar metas diarias.");
  }

  return upsertDailyGoal({
    goalDate,
    revenueTarget: monthPlan.dailyRevenueTarget,
    notes: emptyToUndefined(parsed.notes),
    createdById: actorId,
  });
}
