"use client";

import { SupportTicketPriority } from "@prisma/client";
import { ImageIcon, Upload, X } from "lucide-react";
import type { ChangeEvent, ClipboardEvent } from "react";
import { useActionState, useEffect, useRef, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createSupportTicketAction } from "@/presentation/admin/support/actions";

const priorityLabels: Record<SupportTicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

async function buildImagePreviewDataUrl(file: File) {
  const imageBitmapUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
      nextImage.src = imageBitmapUrl;
    });

    const maxWidth = 1400;
    const maxHeight = 1400;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Nao foi possivel preparar a imagem.");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL("image/webp", 0.84);
  } finally {
    URL.revokeObjectURL(imageBitmapUrl);
  }
}

export function CreateSupportTicketForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createSupportTicketAction, initialActionState);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setAttachmentPreviewUrl("");
      setAttachmentError(null);
      setFileInputKey((currentValue) => currentValue + 1);
    }
  }, [state.status]);

  async function handleImageFile(file?: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAttachmentError("Selecione ou cole um arquivo de imagem valido.");
      return;
    }

    try {
      setAttachmentError(null);
      const previewUrl = await buildImagePreviewDataUrl(file);

      if (previewUrl.length > 900_000) {
        throw new Error("A imagem ficou muito grande. Use um print ou arquivo menor.");
      }

      setAttachmentPreviewUrl(previewUrl);
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "Nao foi possivel processar a imagem.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleImageFile(event.target.files?.[0]);
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    const imageFile = Array.from(event.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();

    if (!imageFile) {
      return;
    }

    event.preventDefault();
    void handleImageFile(imageFile);
  }

  function clearAttachment() {
    setAttachmentPreviewUrl("");
    setAttachmentError(null);
    setFileInputKey((currentValue) => currentValue + 1);
  }

  return (
    <form ref={formRef} action={formAction} onPasteCapture={handlePaste} className="grid gap-4">
      <input type="hidden" name="attachmentImage" value={attachmentPreviewUrl} />

      <div className="space-y-2">
        <Label htmlFor="title">Titulo</Label>
        <Input id="title" name="title" placeholder="Ex.: Ajustar relatorio do caixa" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Prioridade</Label>
        <select id="priority" name="priority" className="admin-native-select" defaultValue={SupportTicketPriority.MEDIUM}>
          {Object.values(SupportTicketPriority).map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detalhes</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          placeholder="Descreva o problema, a tela afetada, o comportamento esperado e qualquer contexto que me ajude a resolver depois."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supportAttachment">Imagem</Label>
        <div className="rounded-[1.35rem] border border-dashed border-border/75 bg-background/28 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              key={fileInputKey}
              id="supportAttachment"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileChange}
              className="max-w-full"
            />
            {attachmentPreviewUrl ? (
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={clearAttachment}>
                <X className="h-4 w-4" />
                Remover
              </Button>
            ) : (
              <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-background/65 px-3 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" />
                Ctrl+V para colar print
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Voce pode subir uma imagem ou colar um print direto com Ctrl+V.
          </p>

          {attachmentError ? <p className="mt-2 text-xs text-destructive">{attachmentError}</p> : null}

          <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-background/35">
            {attachmentPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachmentPreviewUrl} alt="Preview do anexo do ticket" className="max-h-56 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-xs">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  Sem imagem anexada
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3">
        <FormSubmitButton>Abrir ticket</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
