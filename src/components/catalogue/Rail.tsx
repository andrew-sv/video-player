import Link from "next/link";
import type { ReactNode } from "react";

/** Horizontal, scroll-snapping rail. Cards are plain links, so Tab moves through them. */
export function Rail({
  title,
  description,
  moreHref,
  moreLabel,
  children,
}: {
  title: string;
  description?: string;
  moreHref?: string;
  moreLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-8" aria-label={title}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {moreHref && (
          <Link href={moreHref} className="shrink-0 text-sm text-muted hover:text-paper">
            {moreLabel} →
          </Link>
        )}
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8">
        {children}
      </ul>
    </section>
  );
}

export function RailItem({ children }: { children: ReactNode }) {
  return <li className="w-[72vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] xl:w-[22vw]">{children}</li>;
}
