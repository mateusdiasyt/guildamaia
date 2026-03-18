"use client";

import { PaymentMethod } from "@prisma/client";
import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { closeComandaAction } from "@/presentation/admin/pdv/actions";

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
};

type CloseComandaFormProps = {
  comandaId: string;
  openSessions: OpenSessionOption[];
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartao credito",
  DEBIT_CARD: "Cartao debito",
};

export function CloseComandaForm({ comandaId, openSessions }: CloseComandaFormProps) {
  const [state, formAction] = useActionState(closeComandaAction, initialActionState);
  const [discountAmount, setDiscountAmount] = useState("0.00");

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-3">
      <input type="hidden" name="comandaId" value={comandaId} />

      <div className="space-y-2">
        <Label htmlFor={`cashSessionId-${comandaId}`}>Sessao de caixa</Label>
        <select
          id={`cashSessionId-${comandaId}`}
          name="cashSessionId"
          className="admin-native-select"
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
        <Label htmlFor={`paymentMethod-${comandaId}`}>Pagamento</Label>
        <select
          id={`paymentMethod-${comandaId}`}
          name="paymentMethod"
          className="admin-native-select"
          defaultValue={PaymentMethod.PIX}
          required
        >
          {Object.values(PaymentMethod).map((method) => (
            <option key={method} value={method}>
              {paymentLabels[method]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`discountAmount-${comandaId}`}>Desconto (R$)</Label>
        <Input
          id={`discountAmount-${comandaId}`}
          name="discountAmount"
          value={discountAmount}
          onChange={(event) => setDiscountAmount(event.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="md:col-span-3">
        <FormSubmitButton>Fechar comanda e registrar venda</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
