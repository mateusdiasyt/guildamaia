"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { closeCashSessionAction } from "@/presentation/admin/cash/actions";

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
  operator: {
    name: string;
  };
};

type CloseCashSessionFormProps = {
  openSessions: OpenSessionOption[];
};

export function CloseCashSessionForm({ openSessions }: CloseCashSessionFormProps) {
  const [state, formAction] = useActionState(closeCashSessionAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="cashSessionId-close">Sessao de caixa aberta</Label>
        <select
          id="cashSessionId-close"
          name="cashSessionId"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue={openSessions[0]?.id}
          required
        >
          {openSessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.cashRegister.name} ({session.cashRegister.code}) - operador {session.operator.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="closingAmount">Valor contado no fechamento (R$)</Label>
        <Input id="closingAmount" name="closingAmount" placeholder="0.00" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-close">Observacao de fechamento</Label>
        <Textarea id="note-close" name="note" rows={3} />
      </div>

      <div>
        <FormSubmitButton>Fechar caixa</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
