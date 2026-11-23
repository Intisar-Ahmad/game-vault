"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, X, Plus, Bookmark, Check, Loader2, Gamepad2 } from "lucide-react";
import type { IgdbSearchResult } from "@/types/game";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function QuickAddModal({ open, onClose, onAdded }: QuickAddModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeQueryRef = useRef("");

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQuery("");
      setResults([]);
      setHasMore(false);
      setNextOffset(0);
    }
  }, [open]);

  // Initial search on query change
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    activeQueryRef.current = trimmed;

    if (trimmed.length < 2) {
      setResults([]);
      setHasMore(false);
      setNextOffset(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/igdb/search?q=${encodeURIComponent(trimmed)}&offset=0`
        );
        const data = await res.json();
        if (activeQueryRef.current !== trimmed) return;

        setResults(data.results ?? []);
        setHasMore(Boolean(data.hasMore));
        setNextOffset(data.nextOffset ?? 0);
        if (listRef.current) listRef.current.scrollTop = 0;
      } catch (err) {
        console.error(err);
      } finally {
        if (activeQueryRef.current === trimmed) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Load next batch when scrolling down
  const loadMore = useCallback(async () => {
    const trimmed = activeQueryRef.current;
    if (loading || loadingMore || !hasMore || trimmed.length < 2) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/igdb/search?q=${encodeURIComponent(trimmed)}&offset=${nextOffset}`
      );
      const data = await res.json();
      if (activeQueryRef.current !== trimmed) return;

      const incoming: IgdbSearchResult[] = data.results ?? [];
      setResults((prev) => {
        const seen = new Set(prev.map((item) => item.igdbId));
        const unique = incoming.filter((item) => !seen.has(item.igdbId));
        return [...prev, ...unique];
      });
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? nextOffset + incoming.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, nextOffset]);

  // Trigger loadMore when bottom sentinel enters scroll viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!open || !sentinel || !root || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root, rootMargin: "140px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, loadMore]);

  async function handleAdd(game: IgdbSearchResult, target: "library" | "want-to-play") {
    setBusyId(game.igdbId);
    try {
      const endpoint = target === "library" ? "/api/library" : "/api/want-to-play";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(game),
      });

      if (res.ok) {
        setResults((prev) =>
          prev.map((item) =>
            item.igdbId === game.igdbId
              ? {
                  ...item,
                  inLibrary: target === "library" ? true : item.inLibrary,
                  inWantToPlay: target === "want-to-play" ? true : false,
                }
              : item
          )
        );
        onAdded();
      }
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#0b0b10] shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800/80 px-4 py-3.5">
          <Search className="h-5 w-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search IGDB to add games... (e.g. Resident Evil 4, Silksong)"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-800/60"
        >
          {!loading && query.trim().length < 2 && (
            <div className="py-14 text-center text-sm text-zinc-500">
              Type at least 2 characters to search IGDB.
              <p className="mt-1 font-mono text-xs text-zinc-600">
                Tip: Scroll down to load more matches; modal stays open for fast bulk-adding.
              </p>
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-14 text-center text-sm text-zinc-500">
              No games found for &ldquo;{query}&rdquo;.
            </div>
          )}

          {results.map((game) => {
            const isBusy = busyId === game.igdbId;
            return (
              <div
                key={game.igdbId}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-900 border border-zinc-800">
                    {game.coverUrl ? (
                      <Image
                        src={game.coverUrl}
                        alt={game.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-zinc-100">
                      {game.title}
                    </h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-500">
                      {game.releaseYear && <span>{game.releaseYear}</span>}
                      {game.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {game.inLibrary ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> In Library
                    </span>
                  ) : (
                    <>
                      <button
                        disabled={isBusy}
                        onClick={() => handleAdd(game, "library")}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Library
                      </button>

                      {game.inWantToPlay ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs text-amber-400">
                          <Check className="h-3.5 w-3.5" /> Saved
                        </span>
                      ) : (
                        <button
                          disabled={isBusy}
                          onClick={() => handleAdd(game, "want-to-play")}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Bookmark className="h-3.5 w-3.5" /> Want
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Infinite Scroll Sentinel */}
          {results.length > 0 && (
            <div ref={sentinelRef} className="py-4 text-center font-mono text-xs text-zinc-500">
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  Loading more games...
                </span>
              ) : hasMore ? (
                "Scroll for more"
              ) : (
                "End of results"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}