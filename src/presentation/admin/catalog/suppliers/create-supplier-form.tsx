"use client";

import { RecordStatus } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createSupplierAction } from "@/presentation/admin/catalog/suppliers/actions";

export function CreateSupplierForm() {
  const [state, formAction] = useActionState(createSupplierAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="tradeName">Nome fantasia</Label>
        <Input id="tradeName" name="tradeName" placeholder="Fornecedor Exemplo" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="legalName">Razao social</Label>
        <Input id="legalName" name="legalName" placeholder="Fornecedor Exemplo LTDA" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="document">Documento</Label>
        <Input id="document" name="document" placeholder="CNPJ ou CPF" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="contato@fornecedor.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 90000-0000" />
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
        <FormSubmitButton>Criar fornecedor</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
