"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/** Lazy-loaded stills; a native <dialog> gives focus trapping and Esc for free. */
export function StillsGallery({ stills, large, title }: { stills: string[]; large: string[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  function open(i: number) {
    setIndex(i);
    dialog.current?.showModal();
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stills.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => open(i)}
              className="relative block aspect-video w-full overflow-hidden rounded-sm bg-panel"
              aria-label={`${title}, still ${i + 1}`}
            >
              <Image src={src} alt="" fill loading="lazy" sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(92vw,1400px)] bg-transparent backdrop:bg-black/85"
      >
        <div className="relative aspect-video">
          <Image src={large[index]} alt={`${title}, still ${index + 1}`} fill sizes="92vw" className="object-contain" />
        </div>
        <div className="mt-3 flex justify-between text-sm text-paper">
          <button type="button" onClick={() => setIndex((index + large.length - 1) % large.length)}>← Prev</button>
          <form method="dialog"><button>Close</button></form>
          <button type="button" onClick={() => setIndex((index + 1) % large.length)}>Next →</button>
        </div>
      </dialog>
    </>
  );
}
