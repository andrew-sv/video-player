import type { CSSProperties } from "react";
import type { SubtitleStyle } from "@/lib/user-types";

export const SIZE_SCALE = [0.75, 0.9, 1, 1.25, 1.5] as const;
export const SIZE_LABELS = ["Smallest", "Small", "Default", "Large", "Largest"] as const;

// Noto covers the scripts our subtitle languages need (CJK, Arabic, Greek…);
// in production these are subset webfonts loaded per selected language.
const FONTS: Record<SubtitleStyle["font"], string> = {
  sans: '"Noto Sans", var(--font-inter), system-ui, sans-serif',
  serif: '"Noto Serif", Georgia, serif',
  mono: '"Noto Sans Mono", ui-monospace, monospace',
};
const COLORS: Record<SubtitleStyle["color"], string> = { white: "#ffffff", yellow: "#ffe14d", cyan: "#7ff0ff" };
const BACKGROUNDS: Record<SubtitleStyle["background"], string> = {
  none: "transparent",
  translucent: "rgba(0,0,0,0.55)",
  solid: "#000000",
};
const EDGES: Record<SubtitleStyle["edge"], string> = {
  none: "none",
  outline: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 3px #000",
  shadow: "0 2px 4px rgba(0,0,0,0.9)",
};

/** CSS variables consumed by the .shaka-text-container overrides in globals.css. */
export function subtitleCssVars(style: SubtitleStyle): CSSProperties {
  return {
    "--sub-scale": SIZE_SCALE[style.size],
    "--sub-font": FONTS[style.font],
    "--sub-color": COLORS[style.color],
    "--sub-bg": BACKGROUNDS[style.background],
    "--sub-edge": EDGES[style.edge],
  } as CSSProperties;
}
