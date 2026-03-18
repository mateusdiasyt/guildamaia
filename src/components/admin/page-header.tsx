type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/82 px-5 py-4 shadow-[0_12px_30px_-20px_color-mix(in_oklab,var(--foreground)_30%,transparent)] md:px-6 md:py-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_35%,color-mix(in_oklab,var(--primary)_10%,transparent)_100%)] opacity-80" />
      <div className="relative space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-foreground md:text-[1.75rem]">{title}</h1>
        {description ? <p className="max-w-4xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
