"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { openCashSessionAction } from "@/presentation/admin/cash/actions";

type CashRegisterOption = {
  id: string;
  name: string;
  code: string;
};

type OpenCashSessionFormProps = {
  registers: CashRegisterOption[];
};

export function OpenCashSessionForm({ registers }: OpenCashSessionFormProps) {
  const [state, formAction] = useActionState(openCashSessionAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="cashRegisterId">Caixa</Label>
        <select
          id="cashRegisterId"
          name="cashRegisterId"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue={registers[0]?.id}
          required
        >
          {registers.map((register) => (
            <option key={register.id} value={register.id}>
              {register.name} ({register.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="openingAmount">Valor de abertura (R$)</Label>
        <Input id="openingAmount" name="openingAmount" defaultValue="0.00" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Observacao</Label>
        <Textarea id="note" name="note" rows={3} placeholder="Observacao opcional da abertura" />
      </div>

      <div>
        <FormSubmitButton>Abrir caixa</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
