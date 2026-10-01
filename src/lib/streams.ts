// Packaged renditions per stream. In production these come from the media
// pipeline (CMAF/CBCS, one ladder exposed as DASH + HLS) behind a signed CDN URL.

import "server-only";
import type { StreamId } from "./catalogue";

const BASE = "https://storage.googleapis.com/shaka-demo-assets";

export interface StreamSource {
  dash: string;
  audio: string[];
  subtitles: string[];
  /** Unprotected HLS used when the browser has no supported key system. */
  hlsFallback?: string;
  drm?: {
    keySystem: "org.w3.clearkey";
    /** KID (hex) → content key (hex). Server-side only, served by the licence proxy. */
    keys: Record<string, string>;
  };
}

export const STREAMS: Record<StreamId, StreamSource> = {
  sintel: {
    dash: `${BASE}/sintel/dash.mpd`,
    audio: ["en"],
    subtitles: ["en", "de", "es", "fr", "it", "nl", "pl", "pt", "ru", "vi"],
  },
  tos: { dash: `${BASE}/tos-ttml/dash.mpd`, audio: ["en"], subtitles: ["en", "de"] },
  "angel-drm": {
    dash: `${BASE}/angel-one-clearkey/dash.mpd`,
    hlsFallback: `${BASE}/angel-one-hls/hls.m3u8`,
    audio: ["en", "de", "es", "fr", "it"],
    subtitles: ["en", "el", "fr", "pt-BR"],
    drm: {
      keySystem: "org.w3.clearkey",
      keys: { feedf00deedeadbeeff0baadf00dd00d: "00112233445566778899aabbccddeeff" },
    },
  },
};
