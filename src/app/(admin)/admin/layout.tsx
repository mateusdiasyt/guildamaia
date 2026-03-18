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
              <div className="relative inline-flex">
                <p className="group relative inline-flex cursor-default text-xs text-muted-foreground">
                  <span>O site foi feito por Mateus Mendoza @devmanteusmendoza</span>
                  <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-3 hidden w-52 overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_20px_70px_rgba(0,0,0,0.55)] group-hover:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://media.tenor.com/AhTqmaQ6VfoAAAAM/russo-dan%C3%A7a.gif"
                      alt="GIF de danca"
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
