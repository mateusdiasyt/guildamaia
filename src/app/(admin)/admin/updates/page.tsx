import { requirePermission } from "@/application/auth/guards";
import { getSystemUpdates } from "@/application/updates/system-update-service";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS } from "@/domain/auth/permissions";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function UpdatesPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const { updates, setupPending } = await getSystemUpdates();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Atualizacoes do sistema"
        description="Registro interno das melhorias e mudancas publicadas no sistema via codigo."
      />

      <Card>
        <CardHeader>
          <CardTitle>Historico de atualizacoes</CardTitle>
          <CardDescription>Ultimas atualizacoes publicadas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {setupPending ? (
            <p className="text-sm text-amber-600">
              O armazenamento em banco para atualizacoes nao esta ativo neste ambiente. Exibindo atualizacoes publicadas via codigo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Responsavel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-zinc-500">
                      Nenhuma atualizacao foi registrada ainda.
                    </TableCell>
                  </TableRow>
                ) : null}
                {updates.map((updateEntry) => (
                  <TableRow key={updateEntry.id}>
                    <TableCell className="whitespace-nowrap">{dateFormatter.format(updateEntry.createdAt)}</TableCell>
                    <TableCell className="font-medium text-zinc-900">{updateEntry.title}</TableCell>
                    <TableCell className="max-w-[38rem] whitespace-pre-wrap text-sm text-zinc-700">
                      {updateEntry.description}
                    </TableCell>
                    <TableCell>{updateEntry.createdByName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
