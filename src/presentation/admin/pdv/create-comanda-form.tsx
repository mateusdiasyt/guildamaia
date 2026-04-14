"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createComandaAction } from "@/presentation/admin/pdv/actions";

type CustomerOption = {
  id: string;
  fullName: string;
  documentType: "CPF" | "RG";
  documentNumber: string;
};

type CreateComandaFormProps = {
  customers: CustomerOption[];
  presetNumber?: number;
  lockNumber?: boolean;
  onSuccess?: () => void;
};

export function CreateComandaForm({
  customers,
  presetNumber,
  lockNumber = false,
  onSuccess,
}: CreateComandaFormProps) {
  const [state, formAction] = useActionState(createComandaAction, initialActionState);
  const [isWalkIn, setIsWalkIn] = useState(customers.length === 0);

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.fullName} (${customer.documentType}: ${customer.documentNumber})`,
      })),
    [customers],
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="number">Numero da comanda</Label>
        <Input
          key={`number-${presetNumber ?? "manual"}-${lockNumber ? "locked" : "free"}`}
          id="number"
          name="number"
          type="number"
          min={1}
          max={999}
          placeholder="1 a 999"
          defaultValue={presetNumber ? String(presetNumber) : ""}
          readOnly={lockNumber}
          required
        />
        {lockNumber ? (
          <p className="text-xs text-muted-foreground">
            Numero definido pelo slot escolhido no mapa de comandas.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="customerId">Cliente</Label>
        <select
          id="customerId"
          name="customerId"
          className="admin-native-select"
          defaultValue=""
          disabled={isWalkIn}
          required={!isWalkIn && customers.length > 0}
        >
          <option value="">Selecione um cliente</option>
          {customerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {customers.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sem clientes ativos no cadastro. Use comanda avulsa ou cadastre clientes na aba Clientes.
          </p>
        ) : null}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-foreground md:col-span-3">
        <input
          type="checkbox"
          name="isWalkIn"
          checked={isWalkIn}
          onChange={(event) => setIsWalkIn(event.target.checked)}
          className="h-4 w-4 rounded border-border bg-background"
        />
        Comanda avulsa (sem cliente cadastrado)
      </label>

      <div className="md:col-span-3">
        <FormSubmitButton>Criar comanda</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
