"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { upsertDailyGoalAction } from "@/presentation/admin/goals/actions";

type UpsertDailyGoalFormProps = {
  defaultGoalDate: string;
  defaultEntryTicketsTarget?: number;
  defaultConsumptionSalesTarget?: string;
  defaultNotes?: string;
};

export function UpsertDailyGoalForm({
  defaultGoalDate,
  defaultEntryTicketsTarget,
  defaultConsumptionSalesTarget,
  defaultNotes,
}: UpsertDailyGoalFormProps) {
  const [state, formAction] = useActionState(upsertDailyGoalAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="goalDate">Data da meta</Label>
        <Input id="goalDate" name="goalDate" type="date" defaultValue={defaultGoalDate} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="entryTicketsTarget">Meta de ingressos (unidades)</Label>
        <Input
          id="entryTicketsTarget"
          name="entryTicketsTarget"
          type="number"
          min={0}
          step={1}
          defaultValue={defaultEntryTicketsTarget ?? 0}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="consumptionSalesTarget">Meta de consumacao (R$)</Label>
        <Input
          id="consumptionSalesTarget"
          name="consumptionSalesTarget"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={defaultConsumptionSalesTarget ?? "0.00"}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observacao (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultNotes ?? ""}
          placeholder="Detalhes da meta do dia"
        />
      </div>

      <div className="md:col-span-2">
        <FormSubmitButton>Salvar meta diaria</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
