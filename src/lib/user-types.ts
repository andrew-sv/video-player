// Shapes shared by the user service API and its clients (web, mobile, TV).
import type { FilmSummary } from "./catalogue";

export interface SubtitleStyle {
  size: 0 | 1 | 2 | 3 | 4;
  font: "sans" | "serif" | "mono";
  color: "white" | "yellow" | "cyan";
  background: "none" | "translucent" | "solid";
  edge: "none" | "outline" | "shadow";
}

export interface UserPrefs {
  /** Preferred subtitle language (BCP 47), or "off". */
  subtitleLanguage: string;
  subtitleStyle: SubtitleStyle;
}

export const DEFAULT_PREFS: UserPrefs = {
  subtitleLanguage: "en",
  subtitleStyle: { size: 2, font: "sans", color: "white", background: "translucent", edge: "shadow" },
};

export interface ProgressEntry {
  filmId: string;
  positionSec: number;
  durationSec: number;
  updatedAt: number;
}

export interface ProgressReport {
  filmId: string;
  positionSec: number;
  durationSec: number;
  sessionId: string;
  clientTs: number;
}

export interface MeResponse {
  watchlist: FilmSummary[];
  continueWatching: (FilmSummary & { positionSec: number; durationSec: number })[];
  progress: Record<string, ProgressEntry>;
  prefs: UserPrefs;
}
