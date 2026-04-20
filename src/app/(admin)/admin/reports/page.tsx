import { requirePermission } from "@/application/auth/guards";
import { getReportsData } from "@/application/reports/report-service";
import { MetricCard } from "@/components/admin/metric-card";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { ReportFilterForm } from "@/presentation/admin/reports/report-filter-form";

type ReportsPageProps = {
  searchParams: Promise<{
    period?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

function formatPercent(value: number) {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const { period, date, startDate, endDate } = await searchParams;
  const reports = await getReportsData({ period, date, startDate, endDate });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Relatorios"
        description="Visao financeira por periodo com custo, lucro, margem e ROI por categoria e por item."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Relatorio 1 dia"
          value={formatCurrency(reports.oneDay.summary.netRevenue)}
          helper={reports.oneDay.range.label}
        />
        <MetricCard
          title="Relatorio 7 dias"
          value={formatCurrency(reports.sevenDays.summary.netRevenue)}
          helper={reports.sevenDays.range.label}
        />
        <MetricCard
          title="Lucro bruto (periodo)"
          value={formatCurrency(reports.active.summary.grossProfit)}
          helper={`Margem ${formatPercent(reports.active.summary.grossMarginPercent)}`}
        />
        <MetricCard
          title="ROI s/ custo (periodo)"
          value={formatPercent(reports.active.summary.roiOnCostPercent)}
          helper={`Desconto ${formatCurrency(reports.active.summary.discountAmount)}`}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Entrou de grana"
          value={formatCurrency(reports.active.summary.netRevenue)}
          helper={`${reports.active.label} - ${reports.active.range.label}`}
        />
        <MetricCard
          title="Receita bruta"
          value={formatCurrency(reports.active.summary.grossRevenue)}
          helper={`${reports.active.summary.itemsCount} item(ns) vendidos`}
        />
        <MetricCard
          title="Custo total"
          value={formatCurrency(reports.active.summary.totalCost)}
          helper={`${reports.active.summary.salesCount} venda(s) concluidas`}
        />
        <MetricCard
          title="Lucro bruto"
          value={formatCurrency(reports.active.summary.grossProfit)}
          helper={`Margem ${formatPercent(reports.active.summary.grossMarginPercent)}`}
        />
        <MetricCard
          title="ROI sobre custo"
          value={formatPercent(reports.active.summary.roiOnCostPercent)}
          helper="Lucro bruto dividido pelo custo total"
        />
      </section>

      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Filtro do relatorio</CardTitle>
          <CardDescription>
            Selecione o periodo e o calendario atualiza automaticamente sem precisar confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ReportFilterForm
            selectedPeriod={reports.selectedPeriod}
            customStartDate={reports.customStartDate}
            customEndDate={reports.customEndDate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado por categoria</CardTitle>
          <CardDescription>{reports.active.range.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Receita (R$)</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
                <TableHead className="text-right">Lucro bruto (R$)</TableHead>
                <TableHead className="text-right">Margem bruta</TableHead>
                <TableHead className="text-right">ROI s/ custo</TableHead>
                <TableHead className="text-right">% do lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.active.categoryRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Nenhuma venda concluida no periodo selecionado.
                  </TableCell>
                </TableRow>
              ) : null}
              {reports.active.categoryRows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium text-foreground">{row.category}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.grossRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.totalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.grossProfit)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.grossMarginPercent)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.roiOnCostPercent)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.profitSharePercent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado por item</CardTitle>
          <CardDescription>{reports.active.range.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Receita (R$)</TableHead>
                <TableHead className="text-right">Custo (R$)</TableHead>
                <TableHead className="text-right">Lucro bruto (R$)</TableHead>
                <TableHead className="text-right">Margem bruta</TableHead>
                <TableHead className="text-right">ROI s/ custo</TableHead>
                <TableHead className="text-right">% do lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.active.itemRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    Nenhum item vendido no periodo selecionado.
                  </TableCell>
                </TableRow>
              ) : null}
              {reports.active.itemRows.map((row) => (
                <TableRow key={`${row.category}-${row.item}`}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="font-medium text-foreground">{row.item}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.grossRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.totalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.grossProfit)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.grossMarginPercent)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.roiOnCostPercent)}</TableCell>
                  <TableCell className="text-right">{formatPercent(row.profitSharePercent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
