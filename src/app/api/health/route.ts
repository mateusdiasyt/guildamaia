import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type HealthCheck = {
  ok: boolean;
  timestamp: string;
  checks: {
    env: {
      DATABASE_URL: boolean;
      NEXTAUTH_SECRET: boolean;
      NEXTAUTH_URL: boolean;
    };
    db: {
      connected: boolean;
      roleCount?: number;
      userCount?: number;
      error?: string;
    };
  };
};

export async function GET() {
  const envChecks = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
  };

  const response: HealthCheck = {
    ok: false,
    timestamp: new Date().toISOString(),
    checks: {
      env: envChecks,
      db: {
        connected: false,
      },
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    const [roleCount, userCount] = await Promise.all([prisma.role.count(), prisma.user.count()]);
    response.checks.db.connected = true;
    response.checks.db.roleCount = roleCount;
    response.checks.db.userCount = userCount;
  } catch (error) {
    response.checks.db.error = error instanceof Error ? error.message : "Erro desconhecido ao consultar banco.";
  }

  response.ok =
    response.checks.env.DATABASE_URL &&
    response.checks.env.NEXTAUTH_SECRET &&
    response.checks.env.NEXTAUTH_URL &&
    response.checks.db.connected;

  return NextResponse.json(response, { status: response.ok ? 200 : 500 });
}
