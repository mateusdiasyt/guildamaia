import { requirePermission } from "@/application/auth/guards";
import { getBrandCustomizationSnapshot } from "@/application/customization/brand-customization-service";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { UpdateBrandCustomizationForm } from "@/presentation/admin/customization/update-brand-customization-form";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CustomizationPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const customization = await getBrandCustomizationSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Personalizacao"
        description="Ajuste cores da interface, logo e favicon para adaptar o sistema ao visual da sua empresa."
      />

      <Card>
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
          <CardDescription>
            Edite a marca em um unico lugar. Atualizacoes refletem no login, menu lateral e favicon.
            {customization.updatedAt ? ` Ultima alteracao em ${dateFormatter.format(customization.updatedAt)}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customization.setupPending ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/8 px-4 py-4 text-sm text-amber-100">
              O modulo de personalizacao esta pronto, mas o banco deste ambiente ainda nao recebeu a tabela
              `BrandCustomization`. Rode `db:push` e atualize a pagina para liberar a configuracao visual.
            </div>
          ) : (
            <UpdateBrandCustomizationForm initialValues={customization} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
