type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      {description ? <p className="max-w-3xl text-sm text-zinc-600">{description}</p> : null}
    </div>
  );
}
