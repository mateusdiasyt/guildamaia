"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { cancelSaleAction } from "@/presentation/admin/pdv/actions";

type CancelSaleFormProps = {
  saleId: string;
};

export function CancelSaleForm({ saleId }: CancelSaleFormProps) {
  const [state, formAction] = useActionState(cancelSaleAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="saleId" value={saleId} />
      <Input name="cancelReason" placeholder="Motivo" required />
      <Button type="submit" variant="outline" size="sm">
        Cancelar venda
      </Button>
      <ActionFeedback state={state} />
    </form>
  );
}
