"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { registerCashWithdrawalAction } from "@/presentation/admin/cash/actions";

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
};

type CashWithdrawalFormProps = {
  openSessions: OpenSessionOption[];
};

export function CashWithdrawalForm({ openSessions }: CashWithdrawalFormProps) {
  const [state, formAction] = useActionState(registerCashWithdrawalAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="cashSessionId-withdrawal">Sessao de caixa</Label>
        <select
          id="cashSessionId-withdrawal"
          name="cashSessionId"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue={openSessions[0]?.id}
          required
        >
          {openSessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.cashRegister.name} ({session.cashRegister.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor da sangria (R$)</Label>
        <Input id="amount" name="amount" placeholder="0.00" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input id="reason" name="reason" placeholder="Ex: recolhimento de seguranca" required />
      </div>

      <div>
        <FormSubmitButton>Registrar sangria</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
