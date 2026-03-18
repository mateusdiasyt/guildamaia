"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { upsertDailyGoalAction } from "@/presentation/admin/goals/actions";

type UpsertDailyGoalFormProps = {
  defaultGoalDate: string;
  defaultEntryTicketsTarget?: number;
  defaultNotes?: string;
  autoConsumptionSalesTarget?: number | null;
};

export function UpsertDailyGoalForm({
  defaultGoalDate,
  defaultEntryTicketsTarget,
  defaultNotes,
  autoConsumptionSalesTarget,
}: UpsertDailyGoalFormProps) {
  const [state, formAction] = useActionState(upsertDailyGoalAction, initialActionState);
  const hasMonthlyPlan = typeof autoConsumptionSalesTarget === "number";

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

      <div className="space-y-2 md:col-span-2">
        <Label>Meta diaria de consumacao (calculada automaticamente)</Label>
        <div className="rounded-xl border border-border/80 bg-background/65 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">
            {hasMonthlyPlan ? formatCurrency(autoConsumptionSalesTarget ?? 0) : "Planejamento mensal nao configurado"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasMonthlyPlan
              ? "Valor calculado pelo custo mensal + percentual de lucro desejado."
              : "Cadastre o planejamento mensal para liberar o salvamento da meta diaria."}
          </p>
        </div>
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
