"use client";

import { RecordStatus } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createCategoryAction } from "@/presentation/admin/catalog/categories/actions";

export function CreateCategoryForm() {
  const [state, formAction] = useActionState(createCategoryAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Ex: Acessorios" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" placeholder="acessorios" required />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea id="description" name="description" placeholder="Detalhes internos da categoria" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={RecordStatus.ACTIVE}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RecordStatus.ACTIVE}>Ativa</SelectItem>
            <SelectItem value={RecordStatus.INACTIVE}>Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2">
        <FormSubmitButton>Criar categoria</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
