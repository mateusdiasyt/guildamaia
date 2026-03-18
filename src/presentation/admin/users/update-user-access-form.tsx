"use client";

import { useActionState, useMemo, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { updateUserAccessAction } from "@/presentation/admin/users/actions";

type AccessUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  directPermissionIds: string[];
};

type AccessRole = {
  id: string;
  name: string;
};

type AccessPermission = {
  id: string;
  key: string;
  description: string | null;
};

type UpdateUserAccessFormProps = {
  users: AccessUser[];
  roles: AccessRole[];
  permissions: AccessPermission[];
};

export function UpdateUserAccessForm({ users, roles, permissions }: UpdateUserAccessFormProps) {
  const [state, formAction] = useActionState(updateUserAccessAction, initialActionState);
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? users[0],
    [selectedUserId, users],
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="userId-access">Usuario</Label>
          <select
            id="userId-access"
            name="userId"
            className="admin-native-select"
            value={selectedUser?.id ?? ""}
            onChange={(event) => setSelectedUserId(event.target.value)}
            required
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleId-access">Perfil base</Label>
          <select
            id="roleId-access"
            name="roleId"
            className="admin-native-select"
            defaultValue={selectedUser?.roleId}
            key={`role-${selectedUser?.id}`}
            required
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Permissoes adicionais</p>
        <p className="text-xs text-muted-foreground">
          Essas permissoes complementam o perfil base para excecoes operacionais.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border/80 bg-background/75 p-3 md:grid-cols-2">
        {permissions.map((permission) => {
          const fieldId = `permission-${permission.id}`;
          const isChecked = selectedUser?.directPermissionIds.includes(permission.id) ?? false;

          return (
            <label
              key={permission.id}
              htmlFor={fieldId}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/75 bg-card/65 px-3 py-2.5 transition-colors hover:border-border hover:bg-card"
            >
              <input
                id={fieldId}
                type="checkbox"
                name="permissionIds"
                value={permission.id}
                defaultChecked={isChecked}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">{permission.key}</span>
                {permission.description ? (
                  <span className="block text-xs text-muted-foreground">{permission.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <div>
        <FormSubmitButton>Salvar acesso</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}

