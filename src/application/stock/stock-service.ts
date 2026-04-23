import { Prisma } from "@prisma/client";

import { createStockMovementSchema } from "@/domain/stock/schemas";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import { listProductOptions } from "@/infrastructure/db/repositories/product-repository";
import {
  createStockInvoiceXmlRecord,
  isMissingStockInvoiceXmlTableError,
  listStockInvoiceXmls,
  listStockMovements,
  registerStockMovement,
} from "@/infrastructure/db/repositories/stock-repository";

const MAX_XML_FILE_SIZE_BYTES = 2_000_000;

type ParsedStockInvoiceXml = {
  accessKey: string;
  invoiceNumber?: string;
  invoiceSeries?: string;
  supplierName?: string;
  supplierDocument?: string;
  issuedAt?: Date;
  totalAmount?: Prisma.Decimal;
  itemCount: number;
};

function normalizeXmlText(rawValue?: string) {
  return rawValue?.replace(/\s+/g, " ").trim() || undefined;
}

function extractTagBlock(xml: string, tagName: string) {
  const blockRegex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return xml.match(blockRegex)?.[1];
}

function extractTagValue(xml: string, tagName: string) {
  const valueRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return normalizeXmlText(xml.match(valueRegex)?.[1]);
}

function parseXmlDecimal(rawValue?: string) {
  if (!rawValue) {
    return undefined;
  }

  const normalizedValue = rawValue.replace(",", ".").trim();
  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }

  return new Prisma.Decimal(parsedValue.toFixed(2));
}

function parseXmlDate(rawValue?: string) {
  if (!rawValue) {
    return undefined;
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
}

function parseStockInvoiceXml(rawXml: string): ParsedStockInvoiceXml {
  const accessKeyFromId = rawXml.match(/\bId="NFe(\d{44})"/i)?.[1];
  const accessKeyFromTag = extractTagValue(rawXml, "chNFe");
  const accessKey = accessKeyFromId ?? accessKeyFromTag;

  if (!accessKey || !/^\d{44}$/.test(accessKey)) {
    throw new Error("Nao foi possivel identificar a chave de acesso no XML informado.");
  }

  const ideBlock = extractTagBlock(rawXml, "ide") ?? rawXml;
  const issuerBlock = extractTagBlock(rawXml, "emit") ?? rawXml;
  const totalBlock = extractTagBlock(rawXml, "ICMSTot") ?? rawXml;

  const invoiceNumber = extractTagValue(ideBlock, "nNF");
  const invoiceSeries = extractTagValue(ideBlock, "serie");
  const supplierName = extractTagValue(issuerBlock, "xNome");
  const supplierDocument = extractTagValue(issuerBlock, "CNPJ") ?? extractTagValue(issuerBlock, "CPF");
  const issuedAt = parseXmlDate(extractTagValue(ideBlock, "dhEmi") ?? extractTagValue(ideBlock, "dEmi"));
  const totalAmount = parseXmlDecimal(extractTagValue(totalBlock, "vNF"));
  const itemCount = (rawXml.match(/<det\b/gi) ?? []).length;

  return {
    accessKey,
    invoiceNumber,
    invoiceSeries,
    supplierName,
    supplierDocument,
    issuedAt,
    totalAmount,
    itemCount,
  };
}

function ensureXmlStorageAvailable(error: unknown): never {
  if (isMissingStockInvoiceXmlTableError(error)) {
    throw new Error("Modulo de XML de estoque aguardando sincronizacao do banco. Rode o db:push no ambiente atual.");
  }

  throw error instanceof Error ? error : new Error("Nao foi possivel salvar o XML de estoque.");
}

export async function getStockMovements() {
  return listStockMovements();
}

export async function getStockFormOptions() {
  return listProductOptions();
}

export async function getStockInvoiceXmlHistory() {
  try {
    const entries = await listStockInvoiceXmls();
    return {
      entries,
      setupPending: false,
    };
  } catch (error) {
    if (isMissingStockInvoiceXmlTableError(error)) {
      console.warn("[STOCK_XML] Tabela StockInvoiceXml ainda nao existe neste banco.");
      return {
        entries: [],
        setupPending: true,
      };
    }

    throw error;
  }
}

export async function registerStockMovementRecord(input: FormData, actorId?: string) {
  const parsed = createStockMovementSchema.parse({
    productId: input.get("productId"),
    type: input.get("type"),
    quantity: input.get("quantity"),
    unitCost: input.get("unitCost"),
    note: input.get("note"),
  });

  const movement = await registerStockMovement({
    productId: parsed.productId,
    type: parsed.type,
    quantity: parsed.quantity,
    unitCost: parsed.unitCost ? new Prisma.Decimal(parsed.unitCost) : undefined,
    note: parsed.note || undefined,
    operatorId: actorId,
  });

  await createAuditLog({
    userId: actorId,
    action: "stock.movement.create",
    entity: "StockMovement",
    entityId: movement.id,
    metadata: {
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      resultingStock: movement.resultingStock,
    },
  });
}

export async function storeStockInvoiceXmlRecord(input: FormData, actorId?: string) {
  const maybeXmlFile = input.get("xmlFile");
  if (!(maybeXmlFile instanceof File) || maybeXmlFile.size <= 0) {
    throw new Error("Selecione um arquivo XML valido para continuar.");
  }

  if (!maybeXmlFile.name.toLowerCase().endsWith(".xml")) {
    throw new Error("Arquivo invalido. Envie um XML da NF-e.");
  }

  if (maybeXmlFile.size > MAX_XML_FILE_SIZE_BYTES) {
    throw new Error("Arquivo muito grande. Limite de 2 MB por XML.");
  }

  const rawXml = await maybeXmlFile.text();
  if (!rawXml.includes("<") || !rawXml.toLowerCase().includes("infnfe")) {
    throw new Error("O arquivo enviado nao parece ser um XML valido de NF-e.");
  }

  const parsedInvoice = parseStockInvoiceXml(rawXml);

  let created: Awaited<ReturnType<typeof createStockInvoiceXmlRecord>>;
  try {
    created = await createStockInvoiceXmlRecord({
      accessKey: parsedInvoice.accessKey,
      invoiceNumber: parsedInvoice.invoiceNumber,
      invoiceSeries: parsedInvoice.invoiceSeries,
      supplierName: parsedInvoice.supplierName,
      supplierDocument: parsedInvoice.supplierDocument,
      issuedAt: parsedInvoice.issuedAt,
      totalAmount: parsedInvoice.totalAmount,
      itemCount: parsedInvoice.itemCount,
      rawXml,
      sourceFileName: maybeXmlFile.name,
      sourceFileSize: maybeXmlFile.size,
      uploadedById: actorId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Este XML ja foi carregado anteriormente para o estoque.");
    }

    ensureXmlStorageAvailable(error);
  }

  await createAuditLog({
    userId: actorId,
    action: "stock.xml.store",
    entity: "StockInvoiceXml",
    entityId: created.id,
    metadata: {
      accessKey: created.accessKey,
      invoiceNumber: created.invoiceNumber,
      invoiceSeries: created.invoiceSeries,
      supplierName: created.supplierName,
      itemCount: created.itemCount,
      sourceFileName: created.sourceFileName,
      sourceFileSize: created.sourceFileSize,
      importedProducts: false,
    },
  });
}
