import { redirect } from "next/navigation";

import { hasPermission, type PermissionKey } from "@/domain/auth/permissions";
import { getServerAuthSession } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/login");
  }

  return session;
}

export async function requirePermission(permission: PermissionKey) {
  const session = await requireSession();

  if (!hasPermission(session.user.permissions, permission)) {
    redirect("/admin");
  }

  return session;
}
