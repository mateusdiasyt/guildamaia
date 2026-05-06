import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const BRAND_CUSTOMIZATION_ID = "global";

export function isMissingBrandCustomizationTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" && String(error.meta?.table ?? "").includes("BrandCustomization");
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    return normalizedMessage.includes("brandcustomization") && normalizedMessage.includes("does not exist");
  }

  return false;
}

export async function getBrandCustomization() {
  return prisma.brandCustomization.findUnique({
    where: {
      id: BRAND_CUSTOMIZATION_ID,
    },
  });
}

type UpsertBrandCustomizationInput = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  updatedById?: string;
  updatedByName?: string;
};

export async function upsertBrandCustomization(data: UpsertBrandCustomizationInput) {
  return prisma.brandCustomization.upsert({
    where: {
      id: BRAND_CUSTOMIZATION_ID,
    },
    update: data,
    create: {
      id: BRAND_CUSTOMIZATION_ID,
      ...data,
    },
  });
}
