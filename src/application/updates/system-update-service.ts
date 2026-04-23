import { createSystemUpdateSchema } from "@/domain/updates/schemas";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  createSystemUpdate,
  isMissingSystemUpdateTableError,
  listSystemUpdates,
} from "@/infrastructure/db/repositories/system-update-repository";

function ensureSystemUpdateStorageAvailable(error: unknown): never {
  if (isMissingSystemUpdateTableError(error)) {
    throw new Error("Modulo de atualizacoes aguardando sincronizacao do banco. Rode o db:push no ambiente atual.");
  }

  throw error instanceof Error ? error : new Error("Nao foi possivel carregar as atualizacoes do sistema.");
}

export async function getSystemUpdates() {
  try {
    const updates = await listSystemUpdates();
    return {
      updates,
      setupPending: false,
    };
  } catch (error) {
    if (isMissingSystemUpdateTableError(error)) {
      console.warn("[SYSTEM_UPDATE] Tabela SystemUpdate ainda nao existe neste banco.");
      return {
        updates: [],
        setupPending: true,
      };
    }

    throw error;
  }
}

export async function createSystemUpdateRecord(input: FormData, actor: { id?: string; name: string }) {
  const parsed = createSystemUpdateSchema.parse({
    title: input.get("title"),
    description: input.get("description"),
  });

  let created: Awaited<ReturnType<typeof createSystemUpdate>>;
  try {
    created = await createSystemUpdate({
      title: parsed.title,
      description: parsed.description,
      createdById: actor.id,
      createdByName: actor.name,
    });
  } catch (error) {
    ensureSystemUpdateStorageAvailable(error);
  }

  await createAuditLog({
    userId: actor.id,
    action: "system.update.create",
    entity: "SystemUpdate",
    entityId: created.id,
    metadata: {
      title: created.title,
      createdByName: created.createdByName,
      createdAt: created.createdAt.toISOString(),
    },
  });
}
