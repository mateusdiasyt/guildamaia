import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleSlug: string;
      permissions: string[];
      status: "ACTIVE" | "INACTIVE";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    roleSlug: string;
    permissions: string[];
    status: "ACTIVE" | "INACTIVE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleSlug?: string;
    permissions?: string[];
    status?: "ACTIVE" | "INACTIVE";
  }
}
