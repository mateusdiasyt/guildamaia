import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { roleSlugToLabel } from "@/domain/auth/roles";
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

  const roleLabel = roleSlugToLabel(session.user.roleSlug);

  return (
    <div className="flex min-h-screen bg-zinc-100/50">
      <div className="hidden md:block">
        <AdminSidebar
          userName={session.user.name}
          roleLabel={roleLabel}
          permissions={session.user.permissions}
        />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader userName={session.user.name} permissions={session.user.permissions} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
