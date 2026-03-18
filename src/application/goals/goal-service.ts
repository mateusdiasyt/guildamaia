import { upsertDailyGoalSchema } from "@/domain/goals/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import {
  getDailyGoalByDate,
  getDailyGoalProgress,
  listRecentDailyGoals,
  parseGoalDateInput,
  upsertDailyGoal,
} from "@/infrastructure/db/repositories/goal-repository";
import { parseDecimalInput } from "@/lib/decimal";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getGoalsPageData() {
  const now = new Date();
  const [todayGoal, recentGoals] = await Promise.all([getDailyGoalByDate(now), listRecentDailyGoals(20)]);

  const goalsWithProgress = await Promise.all(
    recentGoals.map(async (goal) => {
      const progress = await getDailyGoalProgress({
        goalDate: goal.goalDate,
        entryCategoryId: goal.entryCategoryId,
        consumptionCategoryId: goal.consumptionCategoryId,
      });

      return {
        id: goal.id,
        goalDate: goal.goalDate,
        entryTicketsTarget: goal.entryTicketsTarget,
        consumptionSalesTarget: Number(goal.consumptionSalesTarget),
        entryCategoryName: goal.entryCategory?.name ?? null,
        consumptionCategoryName: goal.consumptionCategory?.name ?? null,
        entryTicketsActual: progress.entryTicketsActual,
        consumptionSalesActual: progress.consumptionSalesActual,
        notes: goal.notes,
      };
    }),
  );

  return {
    todayGoal,
    todayDefaultGoalDate: toDateInputValue(now),
    goals: goalsWithProgress,
  };
}

export async function upsertDailyGoalRecord(input: FormData, actorId: string) {
  const parsed = upsertDailyGoalSchema.parse({
    goalDate: input.get("goalDate"),
    entryTicketsTarget: input.get("entryTicketsTarget"),
    consumptionSalesTarget: input.get("consumptionSalesTarget"),
    notes: input.get("notes"),
  });

  const consumptionSalesTarget = parseDecimalInput(parsed.consumptionSalesTarget);
  if (consumptionSalesTarget.lessThan(0)) {
    throw new Error("Meta de consumacao invalida.");
  }

  return upsertDailyGoal({
    goalDate: parseGoalDateInput(parsed.goalDate),
    entryTicketsTarget: parsed.entryTicketsTarget,
    consumptionSalesTarget,
    entryCategoryId: null,
    consumptionCategoryId: null,
    notes: emptyToUndefined(parsed.notes),
    createdById: actorId,
  });
}
