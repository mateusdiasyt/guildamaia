"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportPeriod } from "@/application/reports/report-service";

type ReportFilterFormProps = {
  selectedPeriod: ReportPeriod;
  referenceDate: string;
  customStartDate: string;
  customEndDate: string;
};

type PeriodOption = {
  value: ReportPeriod;
  label: string;
};

const periodOptions: PeriodOption[] = [
  { value: "1d", label: "Relatorio 1 dia" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "custom", label: "Personalizado" },
];

export function ReportFilterForm({
  selectedPeriod,
  referenceDate,
  customStartDate,
  customEndDate,
}: ReportFilterFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [period, setPeriod] = useState<ReportPeriod>(selectedPeriod);

  function submitForm() {
    formRef.current?.requestSubmit();
  }

  function handlePeriodChange(nextPeriod: ReportPeriod) {
    setPeriod(nextPeriod);
    requestAnimationFrame(submitForm);
  }

  function clearFilters() {
    router.push("/admin/reports");
  }

  const isCustom = period === "custom";

  return (
    <form
      ref={formRef}
      method="GET"
      className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)_44px] xl:grid-cols-[260px_minmax(0,1fr)_44px]"
    >
      <div className="relative">
        <select
          name="period"
          className="admin-native-select w-full pr-9"
          value={period}
          onChange={(event) => handlePeriodChange(event.target.value as ReportPeriod)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isCustom ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="group relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/90">
              <CalendarDays className="h-4 w-4" />
            </span>
            <Input
              name="startDate"
              type="date"
              defaultValue={customStartDate}
              onChange={submitForm}
              className="pl-9 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_14%,transparent)] transition-shadow group-focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_42%,transparent)]"
            />
          </label>

          <label className="group relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/90">
              <CalendarDays className="h-4 w-4" />
            </span>
            <Input
              name="endDate"
              type="date"
              defaultValue={customEndDate}
              onChange={submitForm}
              className="pl-9 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_14%,transparent)] transition-shadow group-focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_42%,transparent)]"
            />
          </label>
        </div>
      ) : (
        <label className="group relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/90">
            <CalendarDays className="h-4 w-4" />
          </span>
          <Input
            name="date"
            type="date"
            defaultValue={referenceDate}
            onChange={submitForm}
            className="pl-9 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_14%,transparent)] transition-shadow group-focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_42%,transparent)]"
          />
          <input type="hidden" name="startDate" value={customStartDate} />
          <input type="hidden" name="endDate" value={customEndDate} />
        </label>
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={clearFilters}
        aria-label="Limpar filtros"
        title="Limpar filtros"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
