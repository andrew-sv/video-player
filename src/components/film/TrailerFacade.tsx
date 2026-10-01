"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Poster + play button until the user asks for the trailer: no player code
 * or video bytes on the critical path of the film page.
 */
export function TrailerFacade({ src, poster, label }: { src: string; poster: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-sm bg-panel">
      {playing ? (
        <video src={src} controls autoPlay playsInline className="h-full w-full bg-black" />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0">
          <Image src={poster} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-black/30 transition-colors group-hover:bg-black/10">
            <span className="flex items-center gap-3 rounded-full bg-ink/80 px-6 py-3 text-sm font-semibold">
              ▶ {label}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
