"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

interface PreviewApi {
  /** Start a muted preview inside `slot`. Only one preview plays at a time. */
  show(ownerId: string, slot: HTMLElement, src: string): void;
  hide(ownerId: string): void;
  enabled(): boolean;
}

const PreviewContext = createContext<PreviewApi | null>(null);

// Kill switch for load spikes (would come from a remote feature flag).
const PREVIEWS_FLAG = process.env.NEXT_PUBLIC_HOVER_PREVIEWS !== "off";

function previewsAllowed(): boolean {
  if (!PREVIEWS_FLAG) return false;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return false; // touch: tap opens page
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return false;
  return true;
}

/**
 * Owns a single pooled <video> that is moved into whichever card is active,
 * so hovering across a rail never spawns dozens of decoders or downloads.
 */
export function PreviewProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ownerRef = useRef<string | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    video.className =
      "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500";
    video.addEventListener("playing", () => video.classList.replace("opacity-0", "opacity-100"));
    videoRef.current = video;
    return () => video.remove();
  }, []);

  const hide = useCallback((ownerId: string) => {
    const video = videoRef.current;
    if (!video || ownerRef.current !== ownerId) return;
    ownerRef.current = null;
    video.pause();
    video.classList.replace("opacity-100", "opacity-0");
    // Dropping src and calling load() aborts the in-flight download.
    video.removeAttribute("src");
    video.load();
    video.remove();
  }, []);

  const show = useCallback((ownerId: string, slot: HTMLElement, src: string) => {
    const video = videoRef.current;
    if (!video) return;
    if (ownerRef.current) hide(ownerRef.current);
    ownerRef.current = ownerId;
    slot.appendChild(video);
    video.src = src;
    video.play().catch(() => {
      /* autoplay refused or source aborted: the still stays visible */
    });
  }, [hide]);

  const api = useMemo<PreviewApi>(() => ({ show, hide, enabled: previewsAllowed }), [show, hide]);
  return <PreviewContext.Provider value={api}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewApi {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used inside PreviewProvider");
  return ctx;
}
