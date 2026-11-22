"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Gamepad2,
  Bookmark,
  Star,
  ArrowRight,
  Trash2,
  SlidersHorizontal,
  Lock,
  LogOut,
} from "lucide-react";
import { QuickAddModal } from "./QuickAddModal";
import { GameDetailModal } from "./GameDetailModal";
import { LoginModal } from "./LoginModal";
import type { LibraryGameItem, WantToPlayItem } from "@/types/game";

type Tab = "library" | "want-to-play";
type SortOption = "recent" | "rating" | "year" | "title";

export function VaultClient() {
  const [tab, setTab] = useState<Tab>("library");
  const [library, setLibrary] = useState<LibraryGameItem[]>([]);
  const [wantToPlay, setWantToPlay] = useState<WantToPlayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<LibraryGameItem | null>(null);

  async function fetchAll() {
    try {
      const [libRes, wantRes, meRes] = await Promise.all([
        fetch("/api/library"),
        fetch("/api/want-to-play"),
        fetch("/api/auth/me"),
      ]);
      const [libData, wantData, meData] = await Promise.all([
        libRes.json(),
        wantRes.json(),
        meRes.json(),
      ]);
      setLibrary(libData.games ?? []);
      setWantToPlay(wantData.games ?? []);
      setIsAdmin(Boolean(meData.isAdmin));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // Global Ctrl+K / Cmd+K shortcut (only when logged in as admin)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (!isAdmin) return;
        e.preventDefault();
        setQuickAddOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setQuickAddOpen(false);
        setSelectedGame(null);
        setLoginOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAdmin]);

  // Unique genres from current tab
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    const source = tab === "library" ? library : wantToPlay;
    source.forEach((g) => g.genres.forEach((genre) => set.add(genre)));
    return Array.from(set).sort();
  }, [library, wantToPlay, tab]);

  // Filtered & sorted Library
  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return library
      .filter((g) => {
        const matchesSearch = !q || g.title.toLowerCase().includes(q);
        const matchesGenre =
          selectedGenre === "all" || g.genres.includes(selectedGenre);
        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
        if (sortBy === "year") return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [library, search, selectedGenre, sortBy]);

  // Filtered Want to Play
  const filteredWant = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wantToPlay.filter((g) => {
      const matchesSearch = !q || g.title.toLowerCase().includes(q);
      const matchesGenre =
        selectedGenre === "all" || g.genres.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });
  }, [wantToPlay, search, selectedGenre]);

  const avgRating = useMemo(() => {
    const rated = library.filter((g) => g.rating !== null);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, g) => acc + (g.rating ?? 0), 0);
    return (sum / rated.length).toFixed(2);
  }, [library]);

  async function handlePromoteToLibrary(item: WantToPlayItem) {
    if (!isAdmin) return;
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const { game } = await res.json();
      setWantToPlay((prev) => prev.filter((g) => g.id !== item.id));
      setLibrary((prev) => [game, ...prev]);
      setTab("library");
      setSelectedGame(game);
    }
  }

  async function handleRemoveWant(id: number) {
    if (!isAdmin) return;
    const res = await fetch(`/api/want-to-play/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWantToPlay((prev) => prev.filter((g) => g.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-[#060609] text-zinc-100">
      {/* Subtle top ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.09),transparent_70%)]" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/70 bg-[#060609]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Gamepad2 className="h-4 w-4" />
              </div>
              <span className="font-mono text-sm font-bold tracking-wider uppercase text-white">
                GameVault
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <button
                onClick={() => {
                  setTab("library");
                  setSelectedGenre("all");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  tab === "library"
                    ? "bg-zinc-800/90 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Library
                <span className="ml-1.5 font-mono text-[11px] text-zinc-500">
                  {library.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setTab("want-to-play");
                  setSelectedGenre("all");
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  tab === "want-to-play"
                    ? "bg-zinc-800/90 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 text-amber-400" />
                Want to Play
                <span className="font-mono text-[11px] text-zinc-500">
                  {wantToPlay.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Game</span>
                  <kbd className="hidden sm:inline-block rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] text-zinc-950/80">
                    Ctrl K
                  </kbd>
                </button>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    setIsAdmin(false);
                  }}
                  title="Lock Vault"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                title="Owner Login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header Stats & Filter Bar */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {tab === "library" ? "Played Collection" : "Want to Play"}
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              {tab === "library" ? (
                <>
                  {library.length} {library.length === 1 ? "title" : "titles"} logged
                  {avgRating && <> · Avg Rating {avgRating} ★</>}
                </>
              ) : (
                <>Separate backlog · {wantToPlay.length} queued</>
              )}
            </p>
          </div>

          {/* Search + Genre + Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by title..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500/50"
              />
            </div>

            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="all">All Genres</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {tab === "library" && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="recent" className="bg-zinc-900">Recently Added</option>
                  <option value="rating" className="bg-zinc-900">Highest Rated</option>
                  <option value="year" className="bg-zinc-900">Release Year</option>
                  <option value="title" className="bg-zinc-900">Title A–Z</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-900/70 border border-zinc-800/60"
              />
            ))}
          </div>
        ) : tab === "library" ? (
          filteredLibrary.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 py-20 text-center">
              <Gamepad2 className="h-10 w-10 text-zinc-700" />
              <p className="mt-3 text-sm font-medium text-zinc-300">
                {library.length === 0
                  ? "Your vault is empty."
                  : "No games match your filters."}
              </p>
              {library.length === 0 && isAdmin && (
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add your first game
                </button>
              )}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredLibrary.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedGame(game)}
                  className="group relative flex flex-col text-left rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-[0_12px_40px_rgba(0,0,0,0.75)] cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                    {game.coverUrl ? (
                      <Image
                        src={game.coverUrl}
                        alt={game.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <Gamepad2 className="h-10 w-10" />
                      </div>
                    )}

                    {/* Rating Badge */}
                    {game.rating !== null && (
                      <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {game.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-500 truncate">
                      {game.releaseYear ?? "—"}
                      {game.genres[0] ? ` · ${game.genres[0]}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : filteredWant.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 py-20 text-center">
            <Bookmark className="h-10 w-10 text-zinc-700" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              Nothing in Want to Play yet.
            </p>
            {isAdmin && (
              <button
                onClick={() => setQuickAddOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Queue a game
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredWant.map((game) => (
              <div
                key={game.id}
                className="group flex flex-col rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                  {game.coverUrl ? (
                    <Image
                      src={game.coverUrl}
                      alt={game.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-700">
                      <Gamepad2 className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <h3 className="truncate text-sm font-semibold text-zinc-100">
                      {game.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                      {game.releaseYear ?? "—"}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handlePromoteToLibrary(game)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 transition-colors cursor-pointer"
                      >
                        Played <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveWant(game.id)}
                        title="Remove"
                        className="rounded-lg border border-zinc-800 p-1.5 text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAdded={fetchAll}
      />

      <GameDetailModal
        key={selectedGame?.id ?? "none"}
        game={selectedGame}
        isAdmin={isAdmin}
        onClose={() => setSelectedGame(null)}
        onUpdated={(updated) => {
          setSelectedGame(updated);
          setLibrary((prev) =>
            prev.map((g) => (g.id === updated.id ? updated : g))
          );
        }}
        onDeleted={(id) => {
          setLibrary((prev) => prev.filter((g) => g.id !== id));
        }}
      />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setIsAdmin(true)}
      />
    </div>
  );
}