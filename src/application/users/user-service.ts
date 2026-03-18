import bcrypt from "bcryptjs";

import { createUserSchema, updateUserStatusSchema } from "@/domain/users/schemas";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  createUser,
  listRoles,
  listUsers,
  updateUserStatus,
} from "@/infrastructure/db/repositories/user-repository";

export async function getUsers(search?: string) {
  return listUsers(search);
}

export async function getRoles() {
  return listRoles();
}

export async function createUserRecord(input: FormData, actorId?: string) {
  const parsed = createUserSchema.parse({
    name: input.get("name"),
    email: input.get("email"),
    password: input.get("password"),
    roleId: input.get("roleId"),
    status: input.get("status"),
  });

  const passwordHash = await bcrypt.hash(parsed.password, 12);

  const created = await createUser({
    name: parsed.name.trim(),
    email: parsed.email.toLowerCase(),
    passwordHash,
    roleId: parsed.roleId,
    status: parsed.status,
  });

  await createAuditLog({
    userId: actorId,
    action: "users.create",
    entity: "User",
    entityId: created.id,
    metadata: {
      email: created.email,
      roleId: created.roleId,
    },
  });
}

export async function updateUserStatusRecord(input: FormData, actorId?: string) {
  const parsed = updateUserStatusSchema.parse({
    userId: input.get("userId"),
    status: input.get("status"),
  });

  const updated = await updateUserStatus(parsed);

  await createAuditLog({
    userId: actorId,
    action: "users.status.update",
    entity: "User",
    entityId: updated.id,
    metadata: {
      status: updated.status,
    },
  });
}
