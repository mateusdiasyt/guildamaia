import { ZodError } from "zod";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: unknown;
};

export const initialActionState: ActionState = {
  status: "idle",
};

const MATEUS_CONTACT_SUFFIX = " Se o problema persistir, contate o Mateus.";

function appendMateusContact(message: string) {
  const trimmed = message.trim();
  if (!trimmed) {
    return `Nao foi possivel concluir a operacao.${MATEUS_CONTACT_SUFFIX}`;
  }

  if (trimmed.toLowerCase().includes("contate o mateus")) {
    return trimmed;
  }

  return `${trimmed.replace(/[.!?]+$/g, "")}.${MATEUS_CONTACT_SUFFIX}`;
}

function toReadableTechnicalMessage(error: unknown) {
  const maybeCode = (error as { code?: unknown } | null)?.code;
  const code = typeof maybeCode === "string" ? maybeCode : undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === "string"
        ? String((error as { message?: unknown }).message)
        : "";
  const normalizedMessage = message.toLowerCase();

  if (code === "P2028" || normalizedMessage.includes("transaction not found") || normalizedMessage.includes("transaction api error")) {
    return "A operacao demorou mais do que o permitido e a transacao foi encerrada. Tente novamente";
  }

  if (code === "P2002") {
    return "Ja existe um registro com esses dados";
  }

  if (code === "P2025") {
    return "O registro nao foi encontrado para concluir a operacao";
  }

  if (code === "P2022") {
    return "Existe uma diferenca entre o sistema e o banco de dados. Sincronize o banco e tente novamente";
  }

  if (code === "P2021") {
    return "Uma tabela necessaria nao foi encontrada no banco de dados";
  }

  if (normalizedMessage.includes("invalid `prisma.") || normalizedMessage.includes("prismaclient")) {
    return "Nao foi possivel concluir a operacao no banco de dados";
  }

  return null;
}

export function toActionErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return appendMateusContact(error.issues[0]?.message ?? "Dados invalidos");
  }

  const technicalMessage = toReadableTechnicalMessage(error);
  if (technicalMessage) {
    return appendMateusContact(technicalMessage);
  }

  if (error instanceof Error) {
    return appendMateusContact(error.message);
  }

  return appendMateusContact("Nao foi possivel concluir a operacao");
}
