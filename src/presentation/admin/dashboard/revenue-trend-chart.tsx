"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";

type RevenueTrendPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

type RevenueTrendChartProps = {
  data: RevenueTrendPoint[];
};

function shortCurrency(value: number) {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--border) 80%, transparent)" />
          <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="revenue"
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={shortCurrency}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${Math.round(value)}`}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "color-mix(in oklab, var(--color-card) 95%, black)",
              color: "var(--color-foreground)",
              boxShadow: "0 20px 35px -25px rgba(0,0,0,0.75)",
            }}
            labelFormatter={(label) => `Dia ${label}`}
            formatter={(value, name) => {
              if (name === "Faturamento") {
                return [formatCurrency(Number(value)), name];
              }

              return [`${value} venda(s)`, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />

          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Faturamento"
            stroke="var(--color-chart-1)"
            strokeWidth={2.2}
            fill="url(#dashboardRevenueGradient)"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            name="Vendas"
            stroke="var(--color-chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
