"use client";

import { ImageIcon, PaintbrushVertical, RefreshCcw, Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandCustomizationDefaults } from "@/domain/customization/defaults";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { updateBrandCustomizationAction } from "@/presentation/admin/customization/actions";

type UpdateBrandCustomizationFormProps = {
  initialValues: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    foregroundColor: string;
    logoDataUrl: string | null;
    faviconDataUrl: string | null;
  };
};

type ImageProcessConfig = {
  maxWidth: number;
  maxHeight: number;
  mimeType: "image/webp" | "image/png";
  quality?: number;
  maxDataUrlLength: number;
  label: string;
};

async function buildImageDataUrl(file: File, config: ImageProcessConfig) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${config.label} invalido. Envie um arquivo de imagem.`);
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error(`Nao foi possivel carregar o ${config.label.toLowerCase()}.`));
      nextImage.src = imageUrl;
    });

    const ratio = Math.min(config.maxWidth / image.width, config.maxHeight / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(`Nao foi possivel preparar o ${config.label.toLowerCase()}.`);
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const dataUrl =
      config.mimeType === "image/png"
        ? canvas.toDataURL(config.mimeType)
        : canvas.toDataURL(config.mimeType, config.quality ?? 0.88);

    if (dataUrl.length > config.maxDataUrlLength) {
      throw new Error(`${config.label} muito grande. Use um arquivo menor.`);
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function UpdateBrandCustomizationForm({ initialValues }: UpdateBrandCustomizationFormProps) {
  const [state, formAction] = useActionState(updateBrandCustomizationAction, initialActionState);
  const [colors, setColors] = useState({
    primaryColor: initialValues.primaryColor,
    accentColor: initialValues.accentColor,
    backgroundColor: initialValues.backgroundColor,
    foregroundColor: initialValues.foregroundColor,
  });
  const [logoDataUrl, setLogoDataUrl] = useState(initialValues.logoDataUrl ?? "");
  const [faviconDataUrl, setFaviconDataUrl] = useState(initialValues.faviconDataUrl ?? "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [logoInputKey, setLogoInputKey] = useState(0);
  const [faviconInputKey, setFaviconInputKey] = useState(0);

  const colorFields = [
    { key: "primaryColor", label: "Cor primaria" },
    { key: "accentColor", label: "Cor de destaque" },
    { key: "backgroundColor", label: "Cor de fundo" },
    { key: "foregroundColor", label: "Cor de texto" },
  ] as const;

  async function handleLogoFile(file?: File | null) {
    if (!file) {
      return;
    }

    try {
      setLogoError(null);
      const nextDataUrl = await buildImageDataUrl(file, {
        maxWidth: 1200,
        maxHeight: 520,
        mimeType: "image/webp",
        quality: 0.88,
        maxDataUrlLength: 700_000,
        label: "Logo",
      });
      setLogoDataUrl(nextDataUrl);
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : "Nao foi possivel processar o logo.");
    }
  }

  async function handleFaviconFile(file?: File | null) {
    if (!file) {
      return;
    }

    try {
      setFaviconError(null);
      const nextDataUrl = await buildImageDataUrl(file, {
        maxWidth: 256,
        maxHeight: 256,
        mimeType: "image/png",
        maxDataUrlLength: 220_000,
        label: "Favicon",
      });
      setFaviconDataUrl(nextDataUrl);
    } catch (error) {
      setFaviconError(error instanceof Error ? error.message : "Nao foi possivel processar o favicon.");
    }
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    void handleLogoFile(event.target.files?.[0]);
  }

  function handleFaviconChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFaviconFile(event.target.files?.[0]);
  }

  function clearLogo() {
    setLogoDataUrl("");
    setLogoError(null);
    setLogoInputKey((currentValue) => currentValue + 1);
  }

  function clearFavicon() {
    setFaviconDataUrl("");
    setFaviconError(null);
    setFaviconInputKey((currentValue) => currentValue + 1);
  }

  function restoreDefaults() {
    setColors({
      primaryColor: brandCustomizationDefaults.primaryColor,
      accentColor: brandCustomizationDefaults.accentColor,
      backgroundColor: brandCustomizationDefaults.backgroundColor,
      foregroundColor: brandCustomizationDefaults.foregroundColor,
    });
    clearLogo();
    clearFavicon();
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="logoDataUrl" value={logoDataUrl} />
      <input type="hidden" name="faviconDataUrl" value={faviconDataUrl} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background/38">
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Cores do tema</p>
              <p className="text-xs text-muted-foreground">
                Essas cores atualizam automaticamente o painel administrativo e tela de login.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {colorFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-2 py-1.5">
                    <input
                      id={field.key}
                      name={field.key}
                      type="color"
                      className="h-9 w-11 cursor-pointer rounded-md border border-border/70 bg-transparent p-0"
                      value={colors[field.key]}
                      onChange={(event) =>
                        setColors((currentValue) => ({
                          ...currentValue,
                          [field.key]: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                      {colors[field.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/38">
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Preview rapido</p>
              <p className="text-xs text-muted-foreground">Visual da marca com as cores atuais.</p>
            </div>

            <div
              className="rounded-2xl border border-border/70 p-3"
              style={{
                background: colors.backgroundColor,
                color: colors.foregroundColor,
                borderColor: `${colors.accentColor}66`,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] opacity-80">Visual</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Painel personalizado</span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: colors.primaryColor,
                    color: colors.backgroundColor,
                  }}
                >
                  CTA
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: colors.primaryColor, color: colors.backgroundColor }}
                >
                  <PaintbrushVertical className="h-3.5 w-3.5" />
                </span>
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: colors.accentColor, color: colors.backgroundColor }}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-background/38">
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Logo do sistema</p>
              <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP. O sistema aplica no login e no painel.</p>
            </div>

            <Input
              key={logoInputKey}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleLogoChange}
            />

            {logoError ? <p className="text-xs text-destructive">{logoError}</p> : null}

            <div className="overflow-hidden rounded-2xl border border-border/75 bg-background/35 p-2">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDataUrl} alt="Preview do logo do sistema" className="h-28 w-full rounded-xl object-contain" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  Sem logo personalizado
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={clearLogo}>
                <X className="h-4 w-4" />
                Remover logo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/38">
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Favicon</p>
              <p className="text-xs text-muted-foreground">Use imagem quadrada para melhor resultado no navegador.</p>
            </div>

            <Input
              key={faviconInputKey}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/x-icon"
              onChange={handleFaviconChange}
            />

            {faviconError ? <p className="text-xs text-destructive">{faviconError}</p> : null}

            <div className="overflow-hidden rounded-2xl border border-border/75 bg-background/35 p-2">
              {faviconDataUrl ? (
                <div className="flex h-28 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={faviconDataUrl} alt="Preview do favicon" className="h-14 w-14 rounded-2xl border border-border/70 object-cover" />
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  Sem favicon personalizado
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={clearFavicon}>
                <X className="h-4 w-4" />
                Remover favicon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FormSubmitButton>Salvar personalizacao</FormSubmitButton>
        <Button type="button" variant="outline" className="gap-2" onClick={restoreDefaults}>
          <RefreshCcw className="h-4 w-4" />
          Restaurar padrao
        </Button>
        <span className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <Upload className="h-3.5 w-3.5" />
          Alteracoes aplicadas sem precisar publicar novo deploy.
        </span>
      </div>

      <ActionFeedback state={state} />
    </form>
  );
}
