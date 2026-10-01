"use client";

import type { ReactNode } from "react";

export interface MenuOption {
  id: string;
  label: ReactNode;
  selected: boolean;
}

/** A labelled radio-style list used by quality / audio / subtitle menus. */
export function OptionList({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: MenuOption[];
  onSelect: (id: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="min-w-44">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <ul className="max-h-72 overflow-y-auto">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={option.selected}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm hover:bg-white/10 ${
                option.selected ? "text-paper" : "text-paper/70"
              }`}
            >
              <span className="w-4">{option.selected ? "✓" : ""}</span>
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Popover({ children, align = "right" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <div
      role="menu"
      className={`absolute bottom-full mb-3 rounded-md border border-white/10 bg-ink/95 p-2 shadow-2xl backdrop-blur ${
        align === "right" ? "right-0" : "left-0"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
