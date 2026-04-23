import { isMissingSystemUpdateTableError, listSystemUpdates } from "@/infrastructure/db/repositories/system-update-repository";

type SystemUpdateFeedItem = {
  id: string;
  title: string;
  description: string;
  createdByName: string;
  createdAt: Date;
};

const CODE_SYSTEM_UPDATES: SystemUpdateFeedItem[] = [
  {
    id: "code-update-stock-xml-20260423",
    title: "XML de produtos no estoque",
    description:
      "Novo fluxo para carregar XML de NF-e direto na aba Estoque.\n\nComo funciona:\n1. Clique em Carregar XML e selecione o arquivo .xml recebido do fornecedor.\n2. O sistema valida chave de acesso, numero/serie da nota, fornecedor, total e quantidade de itens.\n3. O XML original fica guardado com metadados para auditoria e contador.\n4. Nenhum produto e criado ou alterado automaticamente nessa etapa.\n5. O historico de XMLs fica visivel no painel de estoque para conferencia.",
    createdByName: "Equipe de desenvolvimento",
    createdAt: new Date("2026-04-23T11:45:00-03:00"),
  },
];

function mergeSystemUpdatesById(dbUpdates: SystemUpdateFeedItem[]) {
  const merged = new Map<string, SystemUpdateFeedItem>();

  for (const updateEntry of dbUpdates) {
    merged.set(updateEntry.id, updateEntry);
  }

  for (const updateEntry of CODE_SYSTEM_UPDATES) {
    merged.set(updateEntry.id, updateEntry);
  }

  return Array.from(merged.values()).sort((firstEntry, secondEntry) => {
    return secondEntry.createdAt.getTime() - firstEntry.createdAt.getTime();
  });
}

export async function getSystemUpdates() {
  try {
    const updates = await listSystemUpdates();
    return {
      updates: mergeSystemUpdatesById(updates),
      setupPending: false,
    };
  } catch (error) {
    if (isMissingSystemUpdateTableError(error)) {
      console.warn("[SYSTEM_UPDATE] Tabela SystemUpdate ainda nao existe neste banco.");
      return {
        updates: CODE_SYSTEM_UPDATES,
        setupPending: true,
      };
    }

    throw error;
  }
}
