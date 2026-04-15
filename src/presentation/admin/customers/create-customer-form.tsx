"use client";

import { CustomerDocumentType, RecordStatus } from "@prisma/client";
import { useActionState, useEffect } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialActionState, type ActionState } from "@/presentation/admin/common/action-state";
import { createCustomerAction } from "@/presentation/admin/customers/actions";

type CustomerFormInitialData = {
  customerId?: string;
  fullName: string;
  birthDate: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  phone?: string | null;
  email?: string | null;
  status: RecordStatus;
};

type CustomerFormAction = (
  prevState: ActionState | undefined,
  formData: FormData,
) => Promise<ActionState>;

type CreateCustomerFormProps = {
  action?: CustomerFormAction;
  submitLabel?: string;
  initialData?: CustomerFormInitialData;
  onSuccess?: () => void;
};

export function CreateCustomerForm({
  action = createCustomerAction,
  submitLabel = "Cadastrar cliente",
  initialData,
  onSuccess,
}: CreateCustomerFormProps = {}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      {initialData?.customerId ? <input type="hidden" name="customerId" value={initialData.customerId} /> : null}

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Nome e sobrenome do cliente"
          defaultValue={initialData?.fullName ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Data de nascimento</Label>
        <Input id="birthDate" name="birthDate" type="date" defaultValue={initialData?.birthDate ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentType">Tipo de documento</Label>
        <Select name="documentType" defaultValue={initialData?.documentType ?? CustomerDocumentType.CPF}>
          <SelectTrigger id="documentType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CustomerDocumentType.CPF}>CPF</SelectItem>
            <SelectItem value={CustomerDocumentType.RG}>RG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentNumber">Numero do documento</Label>
        <Input
          id="documentNumber"
          name="documentNumber"
          placeholder="Somente numeros para CPF"
          defaultValue={initialData?.documentNumber ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input id="phone" name="phone" placeholder="(11) 90000-0000" defaultValue={initialData?.phone ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (opcional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="cliente@email.com"
          defaultValue={initialData?.email ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={initialData?.status ?? RecordStatus.ACTIVE}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RecordStatus.ACTIVE}>Ativo</SelectItem>
            <SelectItem value={RecordStatus.INACTIVE}>Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2">
        <FormSubmitButton>{submitLabel}</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
