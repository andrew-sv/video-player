// Response of POST /api/playback/authorize.
export interface AuthorizeResponse {
  filmId: string;
  title: string;
  manifestUrl: string;
  hlsFallbackUrl?: string;
  drm?: { keySystem: string; licenseUrl: string; token: string };
  resumeAt: number;
  originalLanguage: string;
  subtitleLanguage: string;
}
