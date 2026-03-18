"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { upsertDailyGoalAction } from "@/presentation/admin/goals/actions";

type UpsertDailyGoalFormProps = {
  defaultGoalDate: string;
  autoRevenueTarget?: number | null;
};

export function UpsertDailyGoalForm({
  defaultGoalDate,
  autoRevenueTarget,
}: UpsertDailyGoalFormProps) {
  const [state, formAction] = useActionState(upsertDailyGoalAction, initialActionState);
  const hasMonthlyPlan = typeof autoRevenueTarget === "number";

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="goalDate" value={defaultGoalDate} />

      <div>
        {hasMonthlyPlan ? (
          <FormSubmitButton>Salvar meta diaria</FormSubmitButton>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-muted px-3.5 text-sm font-medium text-muted-foreground"
          >
            Configure o planejamento mensal primeiro
          </button>
        )}
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
