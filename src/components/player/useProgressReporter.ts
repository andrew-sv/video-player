"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { ProgressReport } from "@/lib/user-types";

const HEARTBEAT_MS = 30_000;

/**
 * Sends watch position to the user service: every 30 s while playing, on
 * pause/seek/end, when the tab is hidden, and via sendBeacon on page exit so
 * the last position survives closing the tab.
 */
export function useProgressReporter(videoRef: RefObject<HTMLVideoElement | null>, filmId: string, active: boolean) {
  const sessionId = useRef<string>("");
  const lastSent = useRef(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) return;
    sessionId.current ||= crypto.randomUUID();

    const payload = (): ProgressReport | null => {
      if (!Number.isFinite(video.duration) || video.currentTime < 1) return null;
      return {
        filmId,
        positionSec: Math.floor(video.currentTime),
        durationSec: Math.floor(video.duration),
        sessionId: sessionId.current,
        clientTs: Date.now(),
      };
    };

    const send = (viaBeacon = false) => {
      const report = payload();
      if (!report || report.positionSec === lastSent.current) return;
      lastSent.current = report.positionSec;
      const body = JSON.stringify(report);
      if (viaBeacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/progress", body);
      } else {
        fetch("/api/progress", { method: "POST", body, keepalive: true }).catch(() => {
          lastSent.current = -1; // retry on the next tick
        });
      }
    };

    const interval = setInterval(() => !video.paused && send(), HEARTBEAT_MS);
    const onPause = () => send();
    const onSeeked = () => send();
    const onEnded = () => send();
    const onVisibility = () => document.visibilityState === "hidden" && send(true);
    const onPageHide = () => send(true);

    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      send(true); // leaving the player via client-side navigation
      clearInterval(interval);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [videoRef, filmId, active]);
}
