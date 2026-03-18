import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { requirePermission } from "@/application/auth/guards";
import { getDashboardSummary } from "@/application/dashboard/dashboard-service";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/domain/auth/permissions";

const quickActionClass =
  "inline-flex h-8 w-full items-center justify-between rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted";

export default async function AdminDashboardPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fundacao V1"
        title="Dashboard Operacional"
        description="Visao consolidada da base ERP para iniciar o ciclo de operacao com governanca e escalabilidade."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Usuarios" value={summary.users} />
        <MetricCard title="Categorias" value={summary.categories} />
        <MetricCard title="Fornecedores" value={summary.suppliers} />
        <MetricCard title="Produtos" value={summary.products} />
        <MetricCard title="Movimentacoes" value={summary.stockMovements} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="border-zinc-200/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Produtos com alerta de estoque</CardTitle>
            <CardDescription>Itens com estoque igual ou abaixo do minimo configurado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.lowStockProducts.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhum produto em situacao critica no momento.</p>
            ) : (
              <ul className="space-y-2">
                {summary.lowStockProducts.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-600">{item.sku}</p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-amber-700">
                      {item.currentStock} / minimo {item.minStock}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Atalhos da fundacao</CardTitle>
            <CardDescription>Fluxos prioritarios para iniciar operacao no painel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/users"
              className={quickActionClass}
            >
              Gerenciar usuarios
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/products"
              className={quickActionClass}
            >
              Cadastro de produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/stock#novo-registro"
              className={quickActionClass}
            >
              Registrar movimentacao
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
