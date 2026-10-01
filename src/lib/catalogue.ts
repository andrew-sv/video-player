// Mock catalogue service. Sintel and Tears of Steel are real Blender open
// movies; the other films are fictional but play real public test streams.

import type { Country } from "./geo";

export type StreamId = "sintel" | "tos" | "angel-drm";

export interface CastMember {
  name: string;
  role: string;
}

export interface RightsWindow {
  territories: Country[] | "ALL";
  except?: Country[];
  /** Offsets in days from today, so the demo always has live windows. */
  fromDay: number;
  toDay: number;
}

export interface Film {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  year: number;
  runtimeMin: number;
  directors: string[];
  cast: CastMember[];
  countries: string[];
  originalLanguage: string;
  genres: string[];
  logline: string;
  synopsis: string;
  /** Muted 10–15 s clip used for hover previews (no DRM). */
  previewUrl: string;
  trailerUrl: string;
  stream: StreamId;
  premium: boolean;
  rights: RightsWindow[];
}

const PREVIEWS = {
  sintel: "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
  bunny: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  jellyfish: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
  flower: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  friday: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
};
const TRAILER = "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4";

const ALL_TIME = { territories: "ALL", fromDay: -900, toDay: 900 } as const;

export const FILMS: Film[] = [
  {
    id: "f01",
    slug: "a-long-winter-in-tbilisi",
    title: "A Long Winter in Tbilisi",
    originalTitle: "გრძელი ზამთარი თბილისში",
    year: 2018,
    runtimeMin: 211,
    directors: ["Nino Kvaratskhelia"],
    cast: [
      { name: "Lika Babluani", role: "Eka" },
      { name: "Giorgi Tsereteli", role: "Levan" },
      { name: "Marina Janashia", role: "Grandmother" },
    ],
    countries: ["Georgia", "France"],
    originalLanguage: "ka",
    genres: ["Drama"],
    logline: "Three generations of women wait out a winter of power cuts.",
    synopsis:
      "In the winter of 1993, the electricity in Tbilisi comes on for two hours a day. In one apartment on Rustaveli Avenue, three generations of women organise their lives around those hours: cooking, quarrelling, listening to the radio for news of a son at the front. Shot in long, patient takes, Kvaratskhelia's epic turns a domestic chronicle into a portrait of a country remaking itself.",
    previewUrl: PREVIEWS.flower,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [ALL_TIME],
  },
  {
    id: "f02",
    slug: "the-salt-orchard",
    title: "The Salt Orchard",
    originalTitle: "Tuz Bahçesi",
    year: 2023,
    runtimeMin: 128,
    directors: ["Elif Aydın"],
    cast: [
      { name: "Deniz Karaca", role: "Selin" },
      { name: "Mehmet Öztürk", role: "Hasan" },
      { name: "Ayşe Demir", role: "Gülay" },
    ],
    countries: ["Türkiye", "Germany"],
    originalLanguage: "tr",
    genres: ["Drama", "Family"],
    logline: "A daughter returns to the salt flats to sell her father's orchard.",
    synopsis:
      "Selin comes home from Istanbul to Lake Tuz to sell the apricot orchard her father has tended for forty years, slowly dying in the salt-laden soil. Over one blistering summer, the sale stalls, a drought deepens, and old silences between father and daughter crack open. Aydın's assured debut won the Golden Orange for Best First Film.",
    previewUrl: PREVIEWS.jellyfish,
    trailerUrl: TRAILER,
    stream: "angel-drm",
    premium: true,
    rights: [
      { territories: ["TR", "GB", "DE"], fromDay: -30, toDay: 120 },
      { territories: ["FR"], fromDay: 3, toDay: 200 },
    ],
  },
  {
    id: "f03",
    slug: "hours-of-the-tide",
    title: "Hours of the Tide",
    originalTitle: "Les Heures de la marée",
    year: 2022,
    runtimeMin: 104,
    directors: ["Camille Verdier"],
    cast: [
      { name: "Juliette Arnaud", role: "Maud" },
      { name: "Bastien Leroy", role: "Yann" },
    ],
    countries: ["France", "Belgium"],
    originalLanguage: "fr",
    genres: ["Romance", "Drama"],
    logline: "On a tidal island in Brittany, two strangers meet twice a day.",
    synopsis:
      "Maud keeps the lighthouse on an island cut off from the mainland at every high tide. Yann, a surveyor sent to assess whether the causeway is worth saving, keeps missing the low water. Verdier's luminous romance moves to the rhythm of the sea, and asks what it means to belong to a place that is disappearing.",
    previewUrl: PREVIEWS.sintel,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [
      { territories: "ALL", except: ["FR"], fromDay: -60, toDay: 300 },
      { territories: ["FR"], fromDay: 20, toDay: 400 },
    ],
  },
  {
    id: "f04",
    slug: "kiln",
    title: "Kiln",
    originalTitle: "窯",
    year: 2021,
    runtimeMin: 142,
    directors: ["Haruki Mori"],
    cast: [
      { name: "Kenji Watanabe", role: "Sōichi" },
      { name: "Aoi Tanaka", role: "Mitsuko" },
    ],
    countries: ["Japan"],
    originalLanguage: "ja",
    genres: ["Drama"],
    logline: "An ageing potter fires his kiln one last time.",
    synopsis:
      "For seven days and nights the anagama kiln must be fed with wood without pause. Sōichi, eighty-one and nearly blind, insists on one final firing, and his estranged daughter Mitsuko returns from Osaka to help. Mori films the ritual almost in real time, a meditation on craft, inheritance and the beauty of imperfection.",
    previewUrl: PREVIEWS.flower,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [{ territories: "ALL", except: ["JP", "US"], fromDay: -200, toDay: 160 }],
  },
  {
    id: "f05",
    slug: "night-ferry-to-bari",
    title: "Night Ferry to Bari",
    originalTitle: "Traghetto notturno",
    year: 2019,
    runtimeMin: 97,
    directors: ["Lorenzo Carbone"],
    cast: [
      { name: "Sara Esposito", role: "Anna" },
      { name: "Arben Hoxha", role: "Ilir" },
    ],
    countries: ["Italy", "Albania"],
    originalLanguage: "it",
    genres: ["Thriller"],
    logline: "One crossing of the Adriatic, one stowaway, one night.",
    synopsis:
      "A ship's nurse discovers a teenage stowaway in a lifeboat on the overnight crossing from Durrës to Bari. Before the ferry docks at dawn she must decide whether to hand him over. A taut, almost wordless thriller staged entirely aboard a working ferry.",
    previewUrl: PREVIEWS.friday,
    trailerUrl: TRAILER,
    stream: "angel-drm",
    premium: true,
    rights: [{ territories: "ALL", fromDay: -90, toDay: 4 }],
  },
  {
    id: "f06",
    slug: "the-cartographers-daughter",
    title: "The Cartographer's Daughter",
    originalTitle: "Córka kartografa",
    year: 2020,
    runtimeMin: 118,
    directors: ["Agnieszka Wróbel"],
    cast: [
      { name: "Zofia Nowak", role: "Ewa" },
      { name: "Piotr Kamiński", role: "Father" },
    ],
    countries: ["Poland"],
    originalLanguage: "pl",
    genres: ["Drama", "History"],
    logline: "A map of a village that no longer exists leads to a family secret.",
    synopsis:
      "After her father's death, Ewa finds a hand-drawn map of a village in the Bieszczady mountains that was erased from official records in 1947. Following its roads, she uncovers what her father spent his life redrawing. Black and white, austere and quietly devastating.",
    previewUrl: PREVIEWS.jellyfish,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [ALL_TIME],
  },
  {
    id: "f07",
    slug: "monsoon-ledger",
    title: "Monsoon Ledger",
    originalTitle: "Barsaat ka Hisaab",
    year: 2023,
    runtimeMin: 156,
    directors: ["Rahul Menon"],
    cast: [
      { name: "Priya Nair", role: "Lakshmi" },
      { name: "Arjun Rao", role: "Inspector Das" },
    ],
    countries: ["India"],
    originalLanguage: "hi",
    genres: ["Crime", "Drama"],
    logline: "A bookkeeper finds a crime hidden in a rice merchant's accounts.",
    synopsis:
      "During the longest monsoon in a decade, Lakshmi balances the books of a Kolkata rice merchant and notices that the numbers describe something no warehouse could hold. A sprawling, rain-soaked procedural about honesty, arithmetic and the price of looking too closely.",
    previewUrl: PREVIEWS.bunny,
    trailerUrl: TRAILER,
    stream: "angel-drm",
    premium: true,
    rights: [{ territories: ["IN", "GB", "US", "ZZ"], fromDay: -15, toDay: 365 }],
  },
  {
    id: "f08",
    slug: "dust-and-bougainvillea",
    title: "Dust and Bougainvillea",
    originalTitle: "Poeira e Buganvília",
    year: 2024,
    runtimeMin: 101,
    directors: ["Mariana Lopes"],
    cast: [
      { name: "Beatriz Costa", role: "Dora" },
      { name: "João Almeida", role: "Tião" },
    ],
    countries: ["Brazil", "Portugal"],
    originalLanguage: "pt",
    genres: ["Comedy", "Drama"],
    logline: "A retired schoolteacher turns her house into a pirate radio station.",
    synopsis:
      "In a sertão town where the only radio station has closed, seventy-year-old Dora starts broadcasting from her kitchen: obituaries, love songs, the lottery numbers, and increasingly pointed remarks about the mayor. A warm, sly comedy about voice and community.",
    previewUrl: PREVIEWS.flower,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [{ territories: "ALL", except: ["US"], fromDay: -5, toDay: 500 }],
  },
  {
    id: "f09",
    slug: "the-quiet-republic",
    title: "The Quiet Republic",
    originalTitle: "Die stille Republik",
    year: 2017,
    runtimeMin: 124,
    directors: ["Jonas Hartmann"],
    cast: [
      { name: "Lena Vogel", role: "Hanna" },
      { name: "Matthias Brandt", role: "Klaus" },
    ],
    countries: ["Germany", "Austria"],
    originalLanguage: "de",
    genres: ["Drama", "History"],
    logline: "A Stasi stenographer is asked to transcribe her own husband.",
    synopsis:
      "East Berlin, 1984. Hanna's job is to type up the recordings made in other people's apartments. When a new reel arrives labelled with her own address, she has to decide what to write down. Hartmann's chamber drama is built almost entirely from sound.",
    previewUrl: PREVIEWS.friday,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [{ territories: "ALL", fromDay: -400, toDay: 30 }],
  },
  {
    id: "f10",
    slug: "under-the-persimmon-tree",
    title: "Under the Persimmon Tree",
    originalTitle: "감나무 아래",
    year: 2022,
    runtimeMin: 113,
    directors: ["Kim Ji-won"],
    cast: [
      { name: "Park Seo-yeon", role: "Min-ji" },
      { name: "Lee Dong-hyun", role: "Grandfather" },
    ],
    countries: ["South Korea"],
    originalLanguage: "ko",
    genres: ["Family", "Drama"],
    logline: "A girl spends one autumn with the grandfather she has never met.",
    synopsis:
      "Sent to the countryside while her parents divorce, eleven-year-old Min-ji is left with a grandfather who speaks mostly to his persimmon tree. As the fruit ripens, so does an unlikely friendship. Gentle and precise, in the tradition of Ozu and Kore-eda.",
    previewUrl: PREVIEWS.bunny,
    trailerUrl: TRAILER,
    stream: "angel-drm",
    premium: true,
    rights: [ALL_TIME],
  },
  {
    id: "f11",
    slug: "seven-rooms",
    title: "Seven Rooms",
    originalTitle: "Siete habitaciones",
    year: 2021,
    runtimeMin: 89,
    directors: ["Tomás Herrera"],
    cast: [
      { name: "Valeria Ruiz", role: "Inés" },
      { name: "Diego Morales", role: "The Owner" },
    ],
    countries: ["Mexico"],
    originalLanguage: "es",
    genres: ["Horror", "Thriller"],
    logline: "A hotel cleaner finds that each room keeps a different year.",
    synopsis:
      "On her first night shift at a crumbling Mexico City hotel, Inés learns the rules: clean the seven rooms on the top floor, never in order, and never look at the calendars. A slow-burning ghost story about labour, memory and the city's buried past.",
    previewUrl: PREVIEWS.sintel,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [ALL_TIME],
  },
  {
    id: "f12",
    slug: "glass-harvest",
    title: "Glass Harvest",
    originalTitle: "Lasihedelmä",
    year: 2016,
    runtimeMin: 240,
    directors: ["Aino Virtanen"],
    cast: [
      { name: "Emma Laine", role: "Kaisa" },
      { name: "Ville Koskinen", role: "Antti" },
    ],
    countries: ["Finland", "Sweden"],
    originalLanguage: "fi",
    genres: ["Drama"],
    logline: "Four seasons in a family of glassblowers, in four hours.",
    synopsis:
      "Across one year and four chapters, the Lahtinen glassworks in Nuutajärvi struggles against cheap imports and its own history. Virtanen's monumental four-hour drama, presented with an intermission, follows a family whose fortunes are as fragile as what they make.",
    previewUrl: PREVIEWS.jellyfish,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [
      { territories: ["GB", "FR", "DE", "ZZ"], fromDay: -100, toDay: 200 },
      { territories: ["US"], fromDay: 10, toDay: 300 },
    ],
  },
  {
    id: "f13",
    slug: "sintel",
    title: "Sintel",
    originalTitle: "Sintel",
    year: 2010,
    runtimeMin: 15,
    directors: ["Colin Levy"],
    cast: [
      { name: "Halina Reijn", role: "Sintel" },
      { name: "Thom Hoffman", role: "Shaman" },
    ],
    countries: ["Netherlands"],
    originalLanguage: "en",
    genres: ["Animation", "Fantasy"],
    logline: "A lonely girl searches for the baby dragon she rescued.",
    synopsis:
      "Sintel, a lonely young woman, searches through a harsh, dangerous world for the baby dragon she once nursed back to health. The Blender Foundation's third open movie, released under Creative Commons, became a landmark of open-source filmmaking.",
    previewUrl: PREVIEWS.sintel,
    trailerUrl: TRAILER,
    stream: "sintel",
    premium: false,
    rights: [ALL_TIME],
  },
  {
    id: "f14",
    slug: "tears-of-steel",
    title: "Tears of Steel",
    originalTitle: "Tears of Steel",
    year: 2012,
    runtimeMin: 12,
    directors: ["Ian Hubert"],
    cast: [
      { name: "Derek de Lint", role: "Old Thom" },
      { name: "Sergio Hasselbaink", role: "Barley" },
      { name: "Vanja Rukavina", role: "Celia" },
    ],
    countries: ["Netherlands"],
    originalLanguage: "en",
    genres: ["Science Fiction"],
    logline: "Scientists in Amsterdam try to save the world from robots.",
    synopsis:
      "In a future Amsterdam, a group of warriors and scientists gather at the Oude Kerk to stage a desperate event from the past, hoping to rescue the world from destructive robots. The Blender Foundation's live-action and VFX open movie.",
    previewUrl: PREVIEWS.bunny,
    trailerUrl: TRAILER,
    stream: "tos",
    premium: false,
    rights: [{ territories: "ALL", except: ["US", "IN"], fromDay: -900, toDay: 900 }],
  },
];

export interface Collection {
  slug: string;
  title: string;
  description: string;
  filmIds: string[];
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "the-long-take",
    title: "The Long Take",
    description: "Films that ask for an evening and give you a world: three hours and more.",
    filmIds: ["f01", "f12", "f07", "f04"],
  },
  {
    slug: "debut-features",
    title: "Debut Features",
    description: "First films from directors we can't stop thinking about.",
    filmIds: ["f02", "f03", "f08", "f11", "f06"],
  },
  {
    slug: "between-the-seas",
    title: "Between the Seas",
    description: "Stories from the Black Sea, the Adriatic and the Atlantic coast.",
    filmIds: ["f05", "f03", "f02", "f01"],
  },
  {
    slug: "open-movies",
    title: "Open Movies",
    description: "Landmarks of open-source filmmaking from the Blender Foundation.",
    filmIds: ["f13", "f14"],
  },
  {
    slug: "family-portraits",
    title: "Family Portraits",
    description: "Parents, children and the things they never say.",
    filmIds: ["f10", "f06", "f09", "f02", "f04", "f12"],
  },
];

const bySlug = new Map(FILMS.map((f) => [f.slug, f]));
const byId = new Map(FILMS.map((f) => [f.id, f]));

export function getFilmBySlug(slug: string): Film | undefined {
  return bySlug.get(slug);
}

export function getFilmById(id: string): Film | undefined {
  return byId.get(id);
}

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export const GENRES = [...new Set(FILMS.flatMap((f) => f.genres))].sort();

/** Small card-sized projection sent to the client. */
export interface FilmSummary {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  year: number;
  runtimeMin: number;
  directors: string[];
  countries: string[];
  previewUrl: string;
}

export function summarize(film: Film): FilmSummary {
  const { id, slug, title, originalTitle, year, runtimeMin, directors, countries, previewUrl } = film;
  return { id, slug, title, originalTitle, year, runtimeMin, directors, countries, previewUrl };
}
