"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_ID = "talbn2jso44";
const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";
const PLAYER_HOST_ID = "footer-credit-youtube-player-host";
const PLAYER_VOLUME = 40;

type YouTubePlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (value: number) => void;
  destroy?: () => void;
};

type YouTubePlayerConstructor = new (
  elementId: string,
  options: {
    height?: string;
    width?: string;
    videoId: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (event: { target: YouTubePlayerInstance }) => void;
    };
  },
) => YouTubePlayerInstance;

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor;
    };
    onYouTubeIframeAPIReady?: () => void;
    __footerCreditApiListeners?: Array<() => void>;
  }
}

function loadYouTubeApi(onReady: () => void) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.YT?.Player) {
    onReady();
    return;
  }

  if (!window.__footerCreditApiListeners) {
    window.__footerCreditApiListeners = [];
  }
  window.__footerCreditApiListeners.push(onReady);

  const hasScript = document.querySelector('script[data-footer-credit-youtube="true"]');
  if (!hasScript) {
    const script = document.createElement("script");
    script.src = YOUTUBE_API_SRC;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-footer-credit-youtube", "true");
    document.head.appendChild(script);
  }

  const currentReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof currentReady === "function") {
      currentReady();
    }

    const listeners = window.__footerCreditApiListeners ?? [];
    window.__footerCreditApiListeners = [];
    for (const listener of listeners) {
      listener();
    }
  };
}

export function FooterCredit() {
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const isPlayerReadyRef = useRef(false);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    loadYouTubeApi(() => {
      if (playerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current = new window.YT.Player(PLAYER_HOST_ID, {
        height: "0",
        width: "0",
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          modestbranding: 1,
          playlist: VIDEO_ID,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            isPlayerReadyRef.current = true;
            event.target.setVolume(PLAYER_VOLUME);
            if (isHoveredRef.current) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
        },
      });
    });

    return () => {
      const player = playerRef.current;
      if (player) {
        player.pauseVideo();
        player.destroy?.();
      }
      playerRef.current = null;
      isPlayerReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReadyRef.current) {
      return;
    }

    player.setVolume(PLAYER_VOLUME);
    if (isHovered) {
      player.playVideo();
      return;
    }

    player.pauseVideo();
  }, [isHovered]);

  return (
    <div
      className="group relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
        <div className="border-t border-border/80 bg-background/80 px-2 py-2">
          <span className="text-[11px] text-muted-foreground">Trilha automatica no hover (40%)</span>
        </div>
      </div>

      <div id={PLAYER_HOST_ID} className="hidden" />
    </div>
  );
}
