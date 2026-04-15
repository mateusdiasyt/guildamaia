import { CustomerDocumentType, RecordStatus } from "@prisma/client";
import { z } from "zod";

const cpfRegex = /^\d{11}$/;
const rgRegex = /^[0-9A-Za-z]{5,20}$/;

function normalizeDocument(value: string) {
  return value.replace(/[.\-\/\s]/g, "");
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

const customerPayloadSchema = z.object({
  fullName: z.string().min(5, "Nome completo obrigatorio"),
  birthDate: z.string().min(1, "Data de nascimento obrigatoria"),
  documentType: z.nativeEnum(CustomerDocumentType),
  documentNumber: z.string().min(5, "Documento obrigatorio"),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

function validateCustomerPayload(
  data: z.infer<typeof customerPayloadSchema>,
  context: z.RefinementCtx,
) {
    const normalized = normalizeDocument(data.documentNumber);

    if (data.documentType === CustomerDocumentType.CPF && !cpfRegex.test(normalized)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: "CPF invalido. Use 11 numeros.",
      });
    }

    if (data.documentType === CustomerDocumentType.RG && !rgRegex.test(normalized)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: "RG invalido.",
      });
    }

    if (!isValidDateInput(data.birthDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthDate"],
        message: "Data de nascimento invalida.",
      });
    }

    const birthDate = new Date(`${data.birthDate}T00:00:00.000Z`);
    const today = new Date();
    if (!Number.isNaN(birthDate.getTime()) && birthDate > today) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthDate"],
        message: "Data de nascimento nao pode ser futura.",
      });
    }
}

export const createCustomerSchema = customerPayloadSchema.superRefine(validateCustomerPayload);

export const updateCustomerSchema = customerPayloadSchema
  .extend({
    customerId: z.string().min(1, "Cliente obrigatorio"),
  })
  .superRefine((data, context) => {
    validateCustomerPayload(data, context);
  });

export function sanitizeDocumentNumber(value: string) {
  return normalizeDocument(value);
}
