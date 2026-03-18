import { CalendarDays, Flag, Ticket, Wallet } from "lucide-react";

import { requirePermission } from "@/application/auth/guards";
import { getGoalsPageData } from "@/application/goals/goal-service";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { UpsertDailyGoalForm } from "@/presentation/admin/goals/upsert-daily-goal-form";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toPercent(actual: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.round((actual / target) * 100);
}

function progressColor(percent: number) {
  if (percent >= 100) {
    return "bg-emerald-500";
  }
  if (percent >= 70) {
    return "bg-amber-500";
  }
  return "bg-primary";
}

function ProgressRow({
  label,
  actual,
  target,
  valueFormatter,
}: {
  label: string;
  actual: number;
  target: number;
  valueFormatter: (value: number) => string;
}) {
  const percent = toPercent(actual, target);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">
          {valueFormatter(actual)} / {valueFormatter(target)}
        </p>
      </div>
      <div className="h-2 rounded-full bg-muted/70">
        <div
          className={`h-2 rounded-full transition-all ${progressColor(percent)}`}
          style={{
            width: `${Math.min(percent, 100)}%`,
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{percent}% da meta</p>
    </div>
  );
}

export default async function MetasPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const data = await getGoalsPageData();
  const todayGoal = data.goals.find((goal) => goal.goalDate.toISOString().slice(0, 10) === data.todayDefaultGoalDate) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planejamento comercial"
        title="Metas diarias"
        description="Configure meta de ingressos e consumacao por dia. O dashboard usa essas metas para acompanhar evolucao em tempo real."
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Configurar meta</CardTitle>
            <CardDescription>
              Defina a meta de entrada (ingressos) e meta de consumacao para o dia.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <UpsertDailyGoalForm
              defaultGoalDate={data.todayDefaultGoalDate}
              defaultEntryTicketsTarget={data.todayGoal?.entryTicketsTarget}
              defaultConsumptionSalesTarget={
                data.todayGoal ? Number(data.todayGoal.consumptionSalesTarget).toFixed(2) : "0.00"
              }
              defaultEntryCategoryId={data.todayGoal?.entryCategoryId ?? undefined}
              defaultConsumptionCategoryId={data.todayGoal?.consumptionCategoryId ?? undefined}
              defaultNotes={data.todayGoal?.notes ?? undefined}
              categories={data.categories}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Meta de hoje</CardTitle>
            <CardDescription>Resumo atual da data {dateFormatter.format(new Date())}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!todayGoal ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
                Nenhuma meta configurada para hoje.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Data</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {dateFormatter.format(todayGoal.goalDate)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Entrada</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Ticket className="h-4 w-4 text-primary" />
                      {todayGoal.entryCategoryName ?? "Todas categorias"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-background/60 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Consumacao</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Wallet className="h-4 w-4 text-primary" />
                      {todayGoal.consumptionCategoryName ?? "Todas categorias"}
                    </p>
                  </div>
                </div>

                <ProgressRow
                  label="Ingressos"
                  actual={todayGoal.entryTicketsActual}
                  target={todayGoal.entryTicketsTarget}
                  valueFormatter={(value) => `${value}`}
                />
                <ProgressRow
                  label="Consumacao"
                  actual={todayGoal.consumptionSalesActual}
                  target={todayGoal.consumptionSalesTarget}
                  valueFormatter={(value) => formatCurrency(value)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Historico de metas</CardTitle>
          <CardDescription>{data.goals.length} registro(s) recente(s).</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Meta ingresso</TableHead>
                <TableHead>Meta consumacao</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Nenhuma meta cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
              {data.goals.map((goal) => {
                const entryPercent = toPercent(goal.entryTicketsActual, goal.entryTicketsTarget);
                const consumptionPercent = toPercent(goal.consumptionSalesActual, goal.consumptionSalesTarget);
                const bestPercent = Math.max(entryPercent, consumptionPercent);

                return (
                  <TableRow key={goal.id}>
                    <TableCell>{dateFormatter.format(goal.goalDate)}</TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {goal.entryTicketsActual} / {goal.entryTicketsTarget}
                      </p>
                      <p className="text-xs text-muted-foreground">{entryPercent}%</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {formatCurrency(goal.consumptionSalesActual)} / {formatCurrency(goal.consumptionSalesTarget)}
                      </p>
                      <p className="text-xs text-muted-foreground">{consumptionPercent}%</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground">
                        Entrada: {goal.entryCategoryName ?? "Todas"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Consumacao: {goal.consumptionCategoryName ?? "Todas"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          bestPercent >= 100
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10"
                            : "border border-primary/30 bg-primary/15 text-primary hover:bg-primary/15"
                        }
                      >
                        <Flag className="mr-1 h-3.5 w-3.5" />
                        {bestPercent >= 100 ? "Meta batida" : "Em andamento"}
                      </Badge>
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
