import { NextResponse } from "next/server";

import { getBrandCustomizationSnapshot } from "@/application/customization/brand-customization-service";

export const dynamic = "force-dynamic";

type BrandingAsset = "logo" | "favicon";

function parseImageDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!matches) {
    return null;
  }

  const [, mimeType, base64Payload] = matches;
  const bytes = Buffer.from(base64Payload, "base64");

  return {
    mimeType,
    bytes,
  };
}

function fallbackPath(asset: BrandingAsset) {
  if (asset === "favicon") {
    return "/favicon-maia-square.png";
  }

  return "/logo-maia.png";
}

export async function GET(request: Request, context: { params: Promise<{ asset: string }> }) {
  const { asset } = await context.params;

  if (asset !== "logo" && asset !== "favicon") {
    return NextResponse.json({ message: "Asset invalido." }, { status: 404 });
  }

  const customization = await getBrandCustomizationSnapshot();
  const assetDataUrl = asset === "logo" ? customization.logoDataUrl : customization.faviconDataUrl;

  if (!assetDataUrl) {
    return NextResponse.redirect(new URL(fallbackPath(asset), request.url));
  }

  const parsedImage = parseImageDataUrl(assetDataUrl);
  if (!parsedImage) {
    return NextResponse.redirect(new URL(fallbackPath(asset), request.url));
  }

  return new NextResponse(parsedImage.bytes, {
    headers: {
      "Content-Type": parsedImage.mimeType,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
