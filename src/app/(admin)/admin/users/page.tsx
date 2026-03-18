import { RecordStatus } from "@prisma/client";
import { Search } from "lucide-react";

import { requirePermission } from "@/application/auth/guards";
import { getPermissions, getRoles, getUsers } from "@/application/users/user-service";
import { PageHeader } from "@/components/admin/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { CreateUserDialog } from "@/presentation/admin/users/create-user-dialog";
import { toggleUserStatusAction } from "@/presentation/admin/users/actions";
import { UpdateUserAccessForm } from "@/presentation/admin/users/update-user-access-form";
import { UserRowActions } from "@/presentation/admin/users/user-row-actions";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    editor?: string;
  }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTotalPermissions(user: {
  role: { permissions: Array<{ permissionId: string }> };
  directPermissions: Array<{ permissionId: string }>;
}) {
  const permissionIds = new Set<string>();
  for (const rolePermission of user.role.permissions) {
    permissionIds.add(rolePermission.permissionId);
  }
  for (const directPermission of user.directPermissions) {
    permissionIds.add(directPermission.permissionId);
  }
  return permissionIds.size;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requirePermission(PERMISSIONS.USERS_VIEW);
  const { q, editor } = await searchParams;
  const search = q?.trim() || undefined;

  const [users, roles, permissions] = await Promise.all([getUsers(search), getRoles(), getPermissions()]);
  const canManageUsers = hasPermission(session.user.permissions, PERMISSIONS.USERS_MANAGE);
  const editorUser = editor ? users.find((user) => user.id === editor) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Administradores"
        description="Gestao de contas administrativas com controle de perfil, status e permissoes por usuario."
      />

      <Card>
        <CardHeader className="space-y-3 border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Lista de administradores</CardTitle>
              <CardDescription>{users.length} registro(s) encontrado(s).</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form method="GET" className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={search ?? ""}
                  placeholder="Buscar usuario"
                  className="h-8 w-[260px] pl-9"
                />
              </form>
              {canManageUsers ? <CreateUserDialog roles={roles} /> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-center">Total permissoes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum usuario encontrado.
                  </TableCell>
                </TableRow>
              ) : null}

              {users.map((user, index) => {
                const nextStatus = user.status === RecordStatus.ACTIVE ? RecordStatus.INACTIVE : RecordStatus.ACTIVE;
                const totalPermissions = getTotalPermissions(user);
                const toggleFormId = `toggle-user-status-${user.id}`;
                const editHref = `/admin/users?${new URLSearchParams({
                  ...(search ? { q: search } : {}),
                  editor: user.id,
                }).toString()}#painel-acesso`;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.role.name}</TableCell>
                    <TableCell className="text-center font-medium">{totalPermissions}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === RecordStatus.ACTIVE
                            ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                            : "border border-zinc-500/25 bg-zinc-500/15 text-zinc-300 hover:bg-zinc-500/15"
                        }
                      >
                        {user.status === RecordStatus.ACTIVE ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form id={toggleFormId} action={toggleUserStatusAction} className="hidden">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="status" value={nextStatus} />
                      </form>
                      {canManageUsers ? (
                        <UserRowActions
                          editHref={editHref}
                          toggleFormId={toggleFormId}
                          toggleLabel={nextStatus === RecordStatus.ACTIVE ? "Reativar usuario" : "Desativar usuario"}
                          destructiveToggle={nextStatus === RecordStatus.INACTIVE}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem permissao</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            Mostrando {users.length === 0 ? 0 : 1}-{users.length} de {users.length} registro(s)
          </div>
        </CardContent>
      </Card>

      {canManageUsers ? (
        <Card id="painel-acesso">
          <CardHeader>
            <CardTitle>Painel de permissoes</CardTitle>
            <CardDescription>
              {editorUser
                ? `Editando permissoes de ${editorUser.name}.`
                : "Selecione um usuario na tabela para editar rapidamente as permissoes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateUserAccessForm
              users={users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                roleId: user.roleId,
                directPermissionIds: user.directPermissions.map((item) => item.permissionId),
              }))}
              roles={roles.map((role) => ({
                id: role.id,
                name: role.name,
                permissionIds: role.permissions.map((item) => item.permissionId),
              }))}
              permissions={permissions.map((permission) => ({
                id: permission.id,
                key: permission.key,
                description: permission.description,
              }))}
              initialUserId={editorUser?.id}
              lockUser={Boolean(editorUser)}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
