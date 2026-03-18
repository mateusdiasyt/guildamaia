import { CustomerDocumentType, RecordStatus } from "@prisma/client";
import { z } from "zod";

const cpfRegex = /^\d{11}$/;
const rgRegex = /^[0-9A-Za-z]{5,20}$/;

function normalizeDocument(value: string) {
  return value.replace(/[.\-\/\s]/g, "");
}

export const createCustomerSchema = z
  .object({
    fullName: z.string().min(5, "Nome completo obrigatorio"),
    documentType: z.nativeEnum(CustomerDocumentType),
    documentNumber: z.string().min(5, "Documento obrigatorio"),
    phone: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Email invalido").optional().or(z.literal("")),
    status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  })
  .superRefine((data, context) => {
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
  });

export function sanitizeDocumentNumber(value: string) {
  return normalizeDocument(value);
}
