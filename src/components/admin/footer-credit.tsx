"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

const VIDEO_ID = "talbn2jso44";
const YOUTUBE_EMBED_BASE = `https://www.youtube.com/embed/${VIDEO_ID}`;

export function FooterCredit() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="group relative inline-flex">
      <p className="inline-flex cursor-default text-xs text-muted-foreground">
        O site foi feito por Mateus Mendoza @devmanteusmendoza
      </p>

      <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-3 w-56 translate-y-1 overflow-hidden rounded-xl border border-border/80 bg-card opacity-0 shadow-[0_20px_70px_rgba(0,0,0,0.55)] transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://media.tenor.com/AhTqmaQ6VfoAAAAM/russo-dan%C3%A7a.gif"
          alt="GIF de danca"
          className="h-40 w-full object-cover"
          loading="lazy"
        />
        <div className="flex items-center justify-between border-t border-border/80 bg-background/80 px-2 py-2">
          <span className="text-[11px] text-muted-foreground">Trilha do GIF</span>
          <button
            type="button"
            onClick={() => setIsPlaying((current) => !current)}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border/80 bg-card px-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? "Parar" : "Tocar"}
          </button>
        </div>
      </div>

      {isPlaying ? (
        <iframe
          title="Musica do rodape"
          src={`${YOUTUBE_EMBED_BASE}?autoplay=1&loop=1&playlist=${VIDEO_ID}`}
          allow="autoplay; encrypted-media"
          className="hidden"
        />
      ) : null}
    </div>
  );
}
