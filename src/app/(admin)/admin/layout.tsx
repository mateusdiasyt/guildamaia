import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getServerAuthSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_15%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_30%),radial-gradient(circle_at_88%_4%,color-mix(in_oklab,var(--accent)_24%,transparent),transparent_36%),radial-gradient(circle_at_80%_88%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_30%)]" />
      <div className="relative flex min-h-screen">
        <div className="hidden md:block">
          <AdminSidebar
            roleSlug={session.user.roleSlug}
            permissions={session.user.permissions}
          />
        </div>

        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader
            userName={session.user.name}
            roleSlug={session.user.roleSlug}
            permissions={session.user.permissions}
          />
          <main className="flex-1 px-4 pb-8 pt-5 md:px-8 md:pt-6">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">{children}</div>
          </main>
          <footer className="border-t border-border/70 px-4 py-3 md:px-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <p className="text-xs text-muted-foreground">
                O site foi feito por Mateus Mendoza @devmanteusmendoza
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
