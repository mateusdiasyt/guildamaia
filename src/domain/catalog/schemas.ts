import { RecordStatus } from "@prisma/client";
import { z } from "zod";

const decimalRegex = /^\d+(\.\d{1,2})?$/;

export const createCategorySchema = z.object({
  name: z.string().min(2, "Nome da categoria obrigatorio"),
  slug: z
    .string()
    .min(2, "Slug obrigatoria")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minusculas, numeros e hifen"),
  description: z.string().max(500, "Descricao longa demais").optional().or(z.literal("")),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const createSupplierSchema = z.object({
  tradeName: z.string().min(2, "Nome fantasia obrigatorio"),
  legalName: z.string().max(120).optional().or(z.literal("")),
  document: z.string().max(24).optional().or(z.literal("")),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  sku: z.string().min(2, "SKU obrigatorio"),
  description: z.string().max(800).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Categoria obrigatoria"),
  supplierId: z.string().optional().or(z.literal("")),
  costPrice: z.string().regex(decimalRegex, "Custo invalido"),
  salePrice: z.string().regex(decimalRegex, "Preco invalido"),
  minStock: z.coerce.number().int().min(0, "Estoque minimo invalido"),
  currentStock: z.coerce.number().int().min(0, "Estoque atual invalido"),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
