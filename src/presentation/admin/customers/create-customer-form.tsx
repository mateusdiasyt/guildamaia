"use client";

import { CustomerDocumentType, RecordStatus } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createCustomerAction } from "@/presentation/admin/customers/actions";

export function CreateCustomerForm() {
  const [state, formAction] = useActionState(createCustomerAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" placeholder="Nome e sobrenome do cliente" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentType">Tipo de documento</Label>
        <Select name="documentType" defaultValue={CustomerDocumentType.CPF}>
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
        <Input id="documentNumber" name="documentNumber" placeholder="Somente numeros para CPF" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input id="phone" name="phone" placeholder="(11) 90000-0000" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (opcional)</Label>
        <Input id="email" name="email" type="email" placeholder="cliente@email.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={RecordStatus.ACTIVE}>
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
        <FormSubmitButton>Cadastrar cliente</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
