"use client";

import { RecordStatus, type Role } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createUserAction } from "@/presentation/admin/users/actions";

type CreateUserFormProps = {
  roles: Role[];
};

export function CreateUserForm({ roles }: CreateUserFormProps) {
  const [state, formAction] = useActionState(createUserAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Nome completo" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="usuario@empresa.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha inicial</Label>
        <Input id="password" name="password" type="password" placeholder="Minimo 8 caracteres" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleId">Perfil</Label>
        <Select name="roleId" defaultValue={roles[0]?.id}>
          <SelectTrigger id="roleId" className="w-full">
            <SelectValue placeholder="Selecione o perfil" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <FormSubmitButton>Criar usuario</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
