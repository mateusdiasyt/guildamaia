import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string | number;
  helper?: string;
};

export function MetricCard({ title, value, helper }: MetricCardProps) {
  return (
    <Card className="border-border/80 bg-card/85">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-[-0.015em] text-foreground">{value}</p>
        {helper ? <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
