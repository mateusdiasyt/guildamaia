import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerAuthSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <section className="w-full max-w-md">
        <Card className="border-zinc-200/80 shadow-xl shadow-zinc-900/5">
          <CardHeader className="space-y-3">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Guilda Maia</p>
            <CardTitle className="text-2xl">Entrar no painel ERP + Guilda</CardTitle>
            <CardDescription>
              Acesso protegido para operacao administrativa, cadastro e controle de estoque.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
