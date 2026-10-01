"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FilmSummary } from "@/lib/catalogue";
import type { MeResponse, UserPrefs } from "@/lib/user-types";

const ME_KEY = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<MeResponse> => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) throw new Error(`me: ${res.status}`);
      return res.json();
    },
  });
}

/** Optimistic watchlist toggle with rollback on failure. */
export function useWatchlistToggle(film: FilmSummary) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (add: boolean) => {
      const res = await fetch(`/api/watchlist/${film.id}`, { method: add ? "PUT" : "DELETE" });
      if (!res.ok) throw new Error(`watchlist: ${res.status}`);
    },
    onMutate: async (add) => {
      await queryClient.cancelQueries({ queryKey: ME_KEY });
      const previous = queryClient.getQueryData<MeResponse>(ME_KEY);
      if (previous) {
        const without = previous.watchlist.filter((f) => f.id !== film.id);
        queryClient.setQueryData<MeResponse>(ME_KEY, {
          ...previous,
          watchlist: add ? [film, ...without] : without,
        });
      }
      return { previous };
    },
    onError: (_error, _add, context) => {
      if (context?.previous) queryClient.setQueryData(ME_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
  });
}

export function useUpdatePrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserPrefs>) => {
      const res = await fetch("/api/prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`prefs: ${res.status}`);
      return (await res.json()) as UserPrefs;
    },
    onSuccess: (prefs) => {
      queryClient.setQueryData<MeResponse>(ME_KEY, (me) => (me ? { ...me, prefs } : me));
    },
  });
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
