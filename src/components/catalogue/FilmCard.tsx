"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import type { FilmSummary } from "@/lib/catalogue";
import { still } from "@/lib/images";
import { usePreview } from "./PreviewProvider";

const HOVER_INTENT_MS = 300;

interface FilmCardProps {
  film: FilmSummary;
  href: string;
  badge?: ReactNode;
  /** 0–1 progress bar for "Continue watching". */
  progress?: number;
  priority?: boolean;
  sizes?: string;
}

export function FilmCard({ film, href, badge, progress, priority, sizes }: FilmCardProps) {
  const id = useId();
  const preview = usePreview();
  const slotRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function start() {
    if (!preview.enabled()) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (slotRef.current) preview.show(id, slotRef.current, film.previewUrl);
    }, HOVER_INTENT_MS);
  }

  function stop() {
    clearTimeout(timer.current);
    preview.hide(id);
  }

  useEffect(() => () => {
    clearTimeout(timer.current);
    preview.hide(id);
  }, [id, preview]);

  return (
    <Link
      href={href}
      className="group block"
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <div className="relative aspect-video overflow-hidden rounded-sm bg-panel">
        <Image
          src={still(film, 0, 800)}
          alt=""
          fill
          priority={priority}
          sizes={sizes ?? "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 70vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div ref={slotRef} className="absolute inset-0" />
        {badge && <div className="absolute left-2 top-2">{badge}</div>}
        {progress !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-display text-xl leading-tight group-hover:underline group-focus-visible:underline">
          {film.title}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted">
          {film.directors.join(", ")} · {film.countries[0]} · {film.year}
        </p>
      </div>
    </Link>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
        tone === "accent" ? "bg-accent text-ink" : "bg-ink/80 text-paper"
      }`}
    >
      {children}
    </span>
  );
}
