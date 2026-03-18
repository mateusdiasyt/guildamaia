import { RecordStatus } from "@prisma/client";

import { requirePermission } from "@/application/auth/guards";
import { getPermissions, getRoles, getUsers } from "@/application/users/user-service";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { CreateUserForm } from "@/presentation/admin/users/create-user-form";
import { UpdateUserAccessForm } from "@/presentation/admin/users/update-user-access-form";
import { toggleUserStatusAction } from "@/presentation/admin/users/actions";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requirePermission(PERMISSIONS.USERS_VIEW);
  const { q } = await searchParams;
  const search = q?.trim() || undefined;

  const [users, roles, permissions] = await Promise.all([
    getUsers(search),
    getRoles(),
    getPermissions(),
  ]);

  const canManageUsers = hasPermission(session.user.permissions, PERMISSIONS.USERS_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Usuarios e Permissoes"
        description="Controle de acesso por perfil para operacao segura do painel administrativo."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtrar usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 md:flex-row" method="GET">
            <Input
              name="q"
              defaultValue={search ?? ""}
              placeholder="Buscar por nome ou email"
              className="md:max-w-sm"
            />
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {canManageUsers ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo usuario</CardTitle>
              <CardDescription>Cadastro de contas administrativas com papel definido.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateUserForm roles={roles} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Editar acesso e permissoes</CardTitle>
              <CardDescription>
                Escolha o usuario, defina o perfil base e adicione permissoes extras via selecao.
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
                }))}
                permissions={permissions.map((permission) => ({
                  id: permission.id,
                  key: permission.key,
                  description: permission.description,
                }))}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Usuarios cadastrados</CardTitle>
          <CardDescription>{users.length} registro(s) encontrado(s).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Permissoes extras</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
                    Nenhum usuario encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
              {users.map((user) => {
                const nextStatus =
                  user.status === RecordStatus.ACTIVE ? RecordStatus.INACTIVE : RecordStatus.ACTIVE;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-zinc-900">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role.name}</TableCell>
                    <TableCell>{user.directPermissions.length}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === RecordStatus.ACTIVE
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"
                        }
                      >
                        {user.status === RecordStatus.ACTIVE ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageUsers ? (
                        <form action={toggleUserStatusAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value={nextStatus} />
                          <Button type="submit" variant="outline" size="sm">
                            {nextStatus === RecordStatus.ACTIVE ? "Reativar" : "Desativar"}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-500">Sem permissao</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
