"use client";

import type { SubtitleStyle } from "@/lib/user-types";
import { SIZE_LABELS, SIZE_SCALE, subtitleCssVars } from "./subtitleStyle";

type Choice<K extends keyof SubtitleStyle> = { value: SubtitleStyle[K]; label: string }[];

const FONTS: Choice<"font"> = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];
const COLORS: Choice<"color"> = [
  { value: "white", label: "White" },
  { value: "yellow", label: "Yellow" },
  { value: "cyan", label: "Cyan" },
];
const BACKGROUNDS: Choice<"background"> = [
  { value: "none", label: "None" },
  { value: "translucent", label: "Translucent" },
  { value: "solid", label: "Solid" },
];
const EDGES: Choice<"edge"> = [
  { value: "none", label: "None" },
  { value: "outline", label: "Outline" },
  { value: "shadow", label: "Shadow" },
];

export function SubtitleSettings({
  style,
  onChange,
}: {
  style: SubtitleStyle;
  onChange: (patch: Partial<SubtitleStyle>) => void;
}) {
  return (
    <div className="w-80 p-2 text-sm">
      <p className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted">Subtitle style</p>

      <div
        className="mb-4 grid h-20 place-items-center rounded bg-[url(https://picsum.photos/seed/sub-preview/640/200)] bg-cover"
        style={subtitleCssVars(style)}
        aria-hidden
      >
        <span
          style={{
            fontFamily: "var(--sub-font)",
            color: "var(--sub-color)",
            background: "var(--sub-bg)",
            textShadow: "var(--sub-edge)",
            fontSize: `${18 * SIZE_SCALE[style.size]}px`,
            padding: "0.05em 0.3em",
          }}
        >
          Subtitles look like this
        </span>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-muted">Size: {SIZE_LABELS[style.size]}</span>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={style.size}
          onChange={(e) => onChange({ size: Number(e.target.value) as SubtitleStyle["size"] })}
          className="w-full accent-[var(--color-accent)]"
        />
      </label>
      <Segmented label="Font" options={FONTS} value={style.font} onChange={(font) => onChange({ font })} />
      <Segmented label="Colour" options={COLORS} value={style.color} onChange={(color) => onChange({ color })} />
      <Segmented
        label="Background"
        options={BACKGROUNDS}
        value={style.background}
        onChange={(background) => onChange({ background })}
      />
      <Segmented label="Edge" options={EDGES} value={style.edge} onChange={(edge) => onChange({ edge })} />
    </div>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="mb-3">
      <legend className="mb-1 text-muted">{label}</legend>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded px-2 py-1 ${
              option.value === value ? "bg-paper text-ink" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
