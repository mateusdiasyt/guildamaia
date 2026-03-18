import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter no minimo 3 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  roleId: z.string().min(1, "Perfil obrigatorio"),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1, "Usuario obrigatorio"),
  status: z.nativeEnum(RecordStatus),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
