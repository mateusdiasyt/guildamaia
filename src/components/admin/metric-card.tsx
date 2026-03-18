import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string | number;
  helper?: string;
};

export function MetricCard({ title, value, helper }: MetricCardProps) {
  return (
    <Card className="border-zinc-200/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-zinc-900">{value}</p>
        {helper ? <p className="mt-1 text-xs text-zinc-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
