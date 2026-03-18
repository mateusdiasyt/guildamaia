"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { upsertMonthlyGoalPlanAction } from "@/presentation/admin/goals/actions";

type UpsertMonthlyGoalPlanFormProps = {
  defaultMonthReference: string;
  defaultCompanyCost?: string;
  defaultDesiredProfitPercent?: string;
};

export function UpsertMonthlyGoalPlanForm({
  defaultMonthReference,
  defaultCompanyCost,
  defaultDesiredProfitPercent,
}: UpsertMonthlyGoalPlanFormProps) {
  const [state, formAction] = useActionState(upsertMonthlyGoalPlanAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="monthReference">Mes de referencia</Label>
        <Input id="monthReference" name="monthReference" type="month" defaultValue={defaultMonthReference} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyCost">Custo da empresa (R$)</Label>
        <Input
          id="companyCost"
          name="companyCost"
          inputMode="decimal"
          placeholder="5000.00"
          defaultValue={defaultCompanyCost ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desiredProfitPercent">Lucro desejado (%)</Label>
        <Input
          id="desiredProfitPercent"
          name="desiredProfitPercent"
          inputMode="decimal"
          placeholder="20"
          defaultValue={defaultDesiredProfitPercent ?? ""}
          required
        />
      </div>

      <div className="md:col-span-3">
        <FormSubmitButton>Salvar planejamento mensal</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
