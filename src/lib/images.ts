// Image CDN stand-in: picsum, seeded so every film keeps the same artwork.
// Kept separate from the catalogue so client components don't bundle it.

export const STILL_COUNT = 4;

export function still(film: { slug: string }, index = 0, width = 1600): string {
  const height = Math.round((width * 9) / 16);
  return `https://picsum.photos/seed/${film.slug}-${index}/${width}/${height}`;
}
