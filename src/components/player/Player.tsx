"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type shakaNamespace from "shaka-player/dist/shaka-player.compiled";
import { formatClock, useMe, useUpdatePrefs } from "@/components/user/hooks";
import type { Locale } from "@/lib/geo";
import { getDictionary, languageName } from "@/lib/i18n";
import type { AuthorizeResponse } from "@/lib/playback-types";
import { DEFAULT_PREFS, type SubtitleStyle } from "@/lib/user-types";
import { OptionList, Popover, type MenuOption } from "./Menu";
import { SubtitleSettings } from "./SubtitleSettings";
import { subtitleCssVars } from "./subtitleStyle";
import { useProgressReporter } from "./useProgressReporter";

type Shaka = typeof shakaNamespace;
type ShakaPlayer = shakaNamespace.Player;

type Phase =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; title: string; detail?: string };

type MenuId = "quality" | "tracks" | "style" | null;

interface TrackState {
  heights: number[];
  activeHeight: number | null;
  abr: boolean;
  canChooseQuality: boolean;
  audio: { id: string; label: string; active: boolean; track: shakaNamespace.extern.AudioTrack }[];
  text: { id: string; label: string; active: boolean; track: shakaNamespace.extern.TextTrack }[];
}

const EMPTY_TRACKS: TrackState = {
  heights: [],
  activeHeight: null,
  abr: true,
  canChooseQuality: false,
  audio: [],
  text: [],
};

const TOKEN_REFRESH_MS = 10 * 60_000;
const CONTROLS_HIDE_MS = 3000;

async function supportsKeySystem(keySystem: string): Promise<boolean> {
  if (!navigator.requestMediaKeySystemAccess) return false;
  try {
    await navigator.requestMediaKeySystemAccess(keySystem, [
      {
        initDataTypes: ["cenc"],
        videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
        audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

async function authorize(filmId: string): Promise<AuthorizeResponse> {
  const res = await fetch("/api/playback/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filmId }),
  });
  if (res.status === 403) throw Object.assign(new Error("not_available"), { code: 403 });
  if (!res.ok) throw new Error(`authorize: ${res.status}`);
  return res.json();
}

export function Player({
  filmId,
  title,
  locale,
  backHref,
}: {
  filmId: string;
  title: string;
  locale: Locale;
  backHref: string;
}) {
  const t = getDictionary(locale);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ShakaPlayer | null>(null);
  const shakaRef = useRef<Shaka | null>(null);
  const tokenRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [notice, setNotice] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackState>(EMPTY_TRACKS);
  const [menu, setMenu] = useState<MenuId>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [time, setTime] = useState({ current: 0, duration: 0, buffered: 0 });
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [volume, setVolume] = useState({ level: 1, muted: false });
  const [fullscreen, setFullscreen] = useState(false);

  const { data: me } = useMe();
  const updatePrefs = useUpdatePrefs();
  const [localStyle, setLocalStyle] = useState<SubtitleStyle | null>(null);
  const subtitleStyle = localStyle ?? me?.prefs.subtitleStyle ?? DEFAULT_PREFS.subtitleStyle;

  useProgressReporter(videoRef, filmId, phase.kind === "ready");

  const refreshTracks = useCallback(() => {
    const player = playerRef.current;
    const shaka = shakaRef.current;
    if (!player || !shaka) return;

    const videoTracks = player.getVideoTracks();
    const heights = [...new Set(videoTracks.map((v) => v.height ?? 0).filter(Boolean))].sort((a, b) => b - a);
    const active = videoTracks.find((v) => v.active);

    const seenAudio = new Set<string>();
    const audio = player.getAudioTracks().flatMap((track) => {
      const key = `${track.language}|${track.roles.join(",")}`;
      if (seenAudio.has(key)) return [];
      seenAudio.add(key);
      const described =
        track.roles.includes("description") || String(track.accessibilityPurpose) === "visually impaired";
      const label = `${languageName(locale, track.language)}${described ? " (Audio description)" : ""}${
        track.channelsCount && track.channelsCount > 2 ? ` ${track.channelsCount}.1` : ""
      }`;
      return [{ id: key, label, active: track.active, track }];
    });

    const text = player.getTextTracks().map((track) => {
      const tags = [
        track.forced && "forced",
        (track.kind === "caption" || String(track.accessibilityPurpose) === "hard of hearing") && "SDH",
      ].filter(Boolean);
      return {
        id: String(track.id),
        label: `${languageName(locale, track.language)}${tags.length ? ` (${tags.join(", ")})` : ""}`,
        active: track.active,
        track,
      };
    });

    setTracks({
      heights,
      activeHeight: active?.height ?? null,
      abr: player.getConfiguration().abr.enabled,
      // Safari's native HLS (src=) exposes no rendition switching to the page.
      canChooseQuality: player.getLoadMode() === shaka.Player.LoadMode.MEDIA_SOURCE && heights.length > 1,
      audio,
      text,
    });
  }, [locale]);

  // ---- Load: authorize → pick key system → attach Shaka → load at resume point
  useEffect(() => {
    let cancelled = false;
    let player: ShakaPlayer | null = null;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    const video = videoRef.current!;

    (async () => {
      let auth: AuthorizeResponse;
      try {
        auth = await authorize(filmId);
      } catch (error) {
        if (cancelled) return;
        const notAvailable = (error as { code?: number }).code === 403;
        setPhase({
          kind: "error",
          title: notAvailable ? t.notAvailable : "Playback could not start",
          detail: notAvailable ? undefined : String(error),
        });
        return;
      }

      // Player code is only ever loaded on this route.
      const { default: shaka } = await import("shaka-player/dist/shaka-player.compiled");
      if (cancelled) return;
      shaka.polyfill.installAll();
      shakaRef.current = shaka;

      let manifestUrl = auth.manifestUrl;
      let drm = auth.drm;
      if (drm && !(await supportsKeySystem(drm.keySystem))) {
        // Safari has no Clear Key; production would use FairPlay + HLS here.
        if (auth.hlsFallbackUrl) {
          manifestUrl = auth.hlsFallbackUrl;
          drm = undefined;
          setNotice("This browser doesn't support the demo DRM (Clear Key). Playing an unprotected copy.");
        } else {
          setPhase({ kind: "error", title: "Your browser can't play protected video" });
          return;
        }
      }
      if (!shaka.Player.isBrowserSupported() && !video.canPlayType("application/vnd.apple.mpegurl")) {
        setPhase({ kind: "error", title: "This browser isn't supported" });
        return;
      }
      if (cancelled) return;

      player = new shaka.Player();
      playerRef.current = player;
      // Must precede attach(): the text displayer is chosen then. With a
      // container Shaka renders cues in the DOM (our styles apply); in iOS
      // native fullscreen it falls back to the system caption renderer.
      player.setVideoContainer(textContainerRef.current);
      await player.attach(video);

      player.configure({
        streaming: {
          bufferingGoal: 30,
          rebufferingGoal: 2,
          // Keep memory flat over a 4-hour film.
          bufferBehind: 30,
        },
        abr: { enabled: true, restrictToElementSize: true },
        preferredAudio: [{ language: auth.originalLanguage }],
        preferredText: auth.subtitleLanguage === "off" ? [] : [{ language: auth.subtitleLanguage }],
        ...(drm && { drm: { servers: { [drm.keySystem]: new URL(drm.licenseUrl, location.href).href } } }),
      });

      if (drm) {
        tokenRef.current = drm.token;
        player.getNetworkingEngine()?.registerRequestFilter((type, request) => {
          if (type === shaka.net.NetworkingEngine.RequestType.LICENSE && tokenRef.current) {
            request.headers["x-playback-token"] = tokenRef.current;
          }
        });
        // Long films: refresh the short-lived token before it expires.
        refreshTimer = setInterval(async () => {
          try {
            tokenRef.current = (await authorize(filmId)).drm?.token ?? tokenRef.current;
          } catch {
            // Rights ended mid-viewing: the current licence lets the viewing finish.
          }
        }, TOKEN_REFRESH_MS);
      }

      player.addEventListener("error", (event) => {
        const error = (event as unknown as { detail: shakaNamespace.util.Error }).detail;
        setPhase({ kind: "error", title: "Playback error", detail: `Shaka error ${error.code}` });
      });
      for (const name of ["trackschanged", "variantchanged", "adaptation", "textchanged", "abrstatuschanged"]) {
        player.addEventListener(name, refreshTracks);
      }

      try {
        await player.load(manifestUrl, auth.resumeAt > 5 ? auth.resumeAt : null);
      } catch (error) {
        if (cancelled) return;
        const code = (error as shakaNamespace.util.Error).code;
        setPhase({
          kind: "error",
          title: code >= 6000 && code < 7000 ? "Protected playback failed" : "The film could not be loaded",
          detail: `Shaka error ${code}`,
        });
        return;
      }
      if (cancelled) return;

      // Make the preferred subtitle visible (selecting a track turns display on).
      if (auth.subtitleLanguage !== "off") {
        const preferred = player
          .getTextTracks()
          .find((track) => track.language.toLowerCase().startsWith(auth.subtitleLanguage.toLowerCase()));
        if (preferred) player.selectTextTrack(preferred);
      }
      refreshTracks();
      setPhase({ kind: "ready" });
      video.play().catch(() => setPlaying(false)); // autoplay with sound may be blocked
    })();

    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
      playerRef.current = null;
      player?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per film
  }, [filmId]);

  // ---- Media element state
  useEffect(() => {
    const video = videoRef.current!;
    const sync = () => {
      const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
      setTime({ current: video.currentTime, duration: video.duration || 0, buffered: end });
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onVolume = () => setVolume({ level: video.volume, muted: video.muted });
    const events: [string, () => void][] = [
      ["timeupdate", sync],
      ["progress", sync],
      ["durationchange", sync],
      ["play", onPlay],
      ["pause", onPause],
      ["waiting", onWaiting],
      ["playing", onPlaying],
      ["canplay", onPlaying],
      ["volumechange", onVolume],
    ];
    events.forEach(([name, fn]) => video.addEventListener(name, fn));
    const onFullscreen = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      events.forEach(([name, fn]) => video.removeEventListener(name, fn));
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  // ---- Controls auto-hide
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) {
        setControlsVisible(false);
        setMenu(null);
      }
    }, CONTROLS_HIDE_MS);
  }, []);
  const poke = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);
  useEffect(() => {
    if (playing) scheduleHide();
    return () => clearTimeout(hideTimer.current);
  }, [playing, scheduleHide]);

  // ---- Actions
  const togglePlay = useCallback(() => {
    const video = videoRef.current!;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current!;
    video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration || Infinity);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current!;
    const video = videoRef.current! as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (document.fullscreenElement) document.exitFullscreen();
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => undefined);
    else video.webkitEnterFullscreen?.(); // iOS: native fullscreen, system caption styling
  }, []);

  const selectQuality = useCallback((id: string) => {
    const player = playerRef.current;
    if (!player) return;
    if (id === "auto") {
      player.configure("abr.enabled", true);
    } else {
      const height = Number(id);
      const candidates = player.getVideoTracks().filter((v) => v.height === height);
      const best = candidates.sort((a, b) => b.bandwidth - a.bandwidth)[0];
      if (best) {
        player.configure("abr.enabled", false);
        player.selectVideoTrack(best, true, 2);
      }
    }
    refreshTracks();
  }, [refreshTracks]);

  const selectAudio = useCallback((id: string) => {
    const entry = tracks.audio.find((a) => a.id === id);
    if (entry) playerRef.current?.selectAudioTrack(entry.track, 2);
    refreshTracks();
  }, [tracks.audio, refreshTracks]);

  const selectText = useCallback((id: string) => {
    const player = playerRef.current;
    if (!player) return;
    const entry = tracks.text.find((s) => s.id === id);
    player.selectTextTrack(entry?.track ?? null);
    // Persist the choice: next film, and other devices, start with it.
    updatePrefs.mutate({ subtitleLanguage: entry?.track.language ?? "off" });
    refreshTracks();
  }, [tracks.text, refreshTracks, updatePrefs]);

  const changeStyle = useCallback((patch: Partial<SubtitleStyle>) => {
    const next = { ...subtitleStyle, ...patch };
    setLocalStyle(next);
    updatePrefs.mutate({ subtitleStyle: next });
  }, [subtitleStyle, updatePrefs]);

  const toggleSubtitles = useCallback(() => {
    const active = tracks.text.find((s) => s.active);
    if (active) selectText("off");
    else {
      const preferred = tracks.text.find((s) => s.track.language.startsWith(me?.prefs.subtitleLanguage ?? "en"));
      const first = preferred ?? tracks.text[0];
      if (first) selectText(first.id);
    }
  }, [tracks.text, selectText, me?.prefs.subtitleLanguage]);

  // ---- Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const video = videoRef.current!;
      const handled = (() => {
        switch (e.key) {
          case " ":
          case "k":
            if (e.target instanceof HTMLButtonElement) return false;
            togglePlay();
            return true;
          case "ArrowLeft":
          case "j":
            seekBy(-10);
            return true;
          case "ArrowRight":
          case "l":
            seekBy(10);
            return true;
          case "ArrowUp":
            video.volume = Math.min(1, video.volume + 0.1);
            return true;
          case "ArrowDown":
            video.volume = Math.max(0, video.volume - 0.1);
            return true;
          case "m":
            video.muted = !video.muted;
            return true;
          case "f":
            toggleFullscreen();
            return true;
          case "c":
            toggleSubtitles();
            return true;
          case "Escape":
            setMenu(null);
            return false;
          default:
            return false;
        }
      })();
      if (handled) {
        e.preventDefault();
        poke();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, toggleFullscreen, toggleSubtitles, poke]);

  // ---- Menus
  const qualityOptions: MenuOption[] = useMemo(
    () => [
      {
        id: "auto",
        label: `Auto${tracks.abr && tracks.activeHeight ? ` (${tracks.activeHeight}p)` : ""}`,
        selected: tracks.abr,
      },
      ...tracks.heights.map((h) => ({
        id: String(h),
        label: `${h}p${h >= 1080 ? " HD" : ""}`,
        selected: !tracks.abr && tracks.activeHeight === h,
      })),
    ],
    [tracks],
  );

  const showControls = controlsVisible || !playing || phase.kind !== "ready";
  const progress = time.duration ? (time.current / time.duration) * 100 : 0;
  const bufferedPct = time.duration ? (time.buffered / time.duration) * 100 : 0;

  return (
    <div
      ref={rootRef}
      className={`player-root fixed inset-0 z-50 bg-black text-paper ${showControls ? "" : "cursor-none"}`}
      style={{ ...subtitleCssVars(subtitleStyle), "--sub-offset": showControls ? "14%" : "5%" } as CSSProperties}
      onPointerMove={poke}
      onClick={() => setMenu(null)}
    >
      <video
        ref={videoRef}
        playsInline
        className="absolute inset-0 h-full w-full"
        onClick={(e) => {
          e.stopPropagation();
          if (menu) setMenu(null);
          else togglePlay();
        }}
        onDoubleClick={toggleFullscreen}
      />
      {/* Shaka's UITextDisplayer renders cues here; styled via CSS variables. */}
      <div ref={textContainerRef} className="pointer-events-none absolute inset-0" />

      {(phase.kind === "loading" || (waiting && playing)) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status" aria-label="Loading">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
        </div>
      )}

      {phase.kind === "error" && (
        <div className="absolute inset-0 grid place-items-center p-6" role="alert">
          <div className="max-w-md text-center">
            <h2 className="font-display text-4xl">{phase.title}</h2>
            {phase.detail && <p className="mt-3 text-sm text-muted">{phase.detail}</p>}
            <Link href={backHref} className="mt-8 inline-block rounded-sm bg-paper px-6 py-3 text-sm font-semibold text-ink">
              ← Back to the film
            </Link>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        className={`absolute inset-x-0 top-0 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity sm:p-6 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Link href={backHref} className="rounded-full p-2 text-xl hover:bg-white/10" aria-label="Back">
          ←
        </Link>
        <h1 className="font-display text-2xl">{title}</h1>
      </div>

      {notice && showControls && (
        <p className="absolute left-1/2 top-20 max-w-lg -translate-x-1/2 rounded bg-ink/90 px-4 py-2 text-center text-sm text-paper/90">
          {notice}
        </p>
      )}

      {phase.kind === "ready" && !playing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-3xl hover:bg-black/80"
          aria-label={t.play}
        >
          ▶
        </button>
      )}

      {/* Bottom controls */}
      {phase.kind === "ready" && (
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-16 transition-opacity sm:px-6 ${
            showControls ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex items-center gap-3 text-sm tabular-nums">
            <span>{formatClock(time.current)}</span>
            <div className="relative h-5 flex-1">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/20">
                <div className="absolute inset-y-0 left-0 rounded bg-white/35" style={{ width: `${bufferedPct}%` }} />
                <div className="absolute inset-y-0 left-0 rounded bg-accent" style={{ width: `${progress}%` }} />
              </div>
              <input
                type="range"
                aria-label="Seek"
                aria-valuetext={`${formatClock(time.current)} of ${formatClock(time.duration)}`}
                min={0}
                max={time.duration || 0}
                step={1}
                value={time.current}
                onChange={(e) => {
                  videoRef.current!.currentTime = Number(e.target.value);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="text-paper/70">-{formatClock(time.duration - time.current)}</span>
          </div>

          <div className="mt-2 flex items-center gap-1 sm:gap-2">
            <IconButton label={playing ? "Pause (k)" : "Play (k)"} onClick={togglePlay}>
              {playing ? "❚❚" : "▶"}
            </IconButton>
            <IconButton label="Back 10 seconds" onClick={() => seekBy(-10)}>↺10</IconButton>
            <IconButton label="Forward 10 seconds" onClick={() => seekBy(10)}>10↻</IconButton>
            <IconButton
              label={volume.muted ? "Unmute (m)" : "Mute (m)"}
              onClick={() => (videoRef.current!.muted = !videoRef.current!.muted)}
            >
              {volume.muted || volume.level === 0 ? "🔇" : "🔊"}
            </IconButton>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.05}
              value={volume.muted ? 0 : volume.level}
              onChange={(e) => {
                const video = videoRef.current!;
                video.volume = Number(e.target.value);
                video.muted = video.volume === 0;
              }}
              className="hidden w-24 accent-[var(--color-paper)] sm:block"
            />

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {(tracks.audio.length > 1 || tracks.text.length > 0) && (
                <div className="relative">
                  <IconButton
                    label={`${t.audio} & ${t.subtitles} (c)`}
                    expanded={menu === "tracks"}
                    onClick={() => setMenu(menu === "tracks" ? null : "tracks")}
                  >
                    CC
                  </IconButton>
                  {menu === "tracks" && (
                    <Popover>
                      <div className="flex gap-2">
                        {tracks.audio.length > 1 && (
                          <OptionList
                            label={t.audio}
                            options={tracks.audio.map((a) => ({ id: a.id, label: a.label, selected: a.active }))}
                            onSelect={selectAudio}
                          />
                        )}
                        <OptionList
                          label={t.subtitles}
                          options={[
                            { id: "off", label: "Off", selected: !tracks.text.some((s) => s.active) },
                            ...tracks.text.map((s) => ({ id: s.id, label: s.label, selected: s.active })),
                          ]}
                          onSelect={selectText}
                        />
                      </div>
                    </Popover>
                  )}
                </div>
              )}
              <div className="relative">
                <IconButton
                  label="Subtitle style"
                  expanded={menu === "style"}
                  onClick={() => setMenu(menu === "style" ? null : "style")}
                >
                  Aa
                </IconButton>
                {menu === "style" && (
                  <Popover>
                    <SubtitleSettings style={subtitleStyle} onChange={changeStyle} />
                  </Popover>
                )}
              </div>
              {tracks.canChooseQuality && (
                <div className="relative">
                  <IconButton
                    label="Quality"
                    expanded={menu === "quality"}
                    onClick={() => setMenu(menu === "quality" ? null : "quality")}
                  >
                    <span className="text-xs font-semibold">
                      {tracks.abr ? "AUTO" : `${tracks.activeHeight}p`}
                    </span>
                  </IconButton>
                  {menu === "quality" && (
                    <Popover>
                      <OptionList label="Quality" options={qualityOptions} onSelect={selectQuality} />
                    </Popover>
                  )}
                </div>
              )}
              <IconButton label={fullscreen ? "Exit full screen (f)" : "Full screen (f)"} onClick={toggleFullscreen}>
                {fullscreen ? "⤡" : "⤢"}
              </IconButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string;
  onClick: () => void;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      aria-expanded={expanded}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid h-10 min-w-10 place-items-center rounded-full px-2 text-lg hover:bg-white/10"
    >
      {children}
    </button>
  );
}
