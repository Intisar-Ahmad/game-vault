"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, Calendar, Save, Check, Gamepad2 } from "lucide-react";
import { StarRating } from "./StarRating";
import type { LibraryGameItem } from "@/types/game";

interface GameDetailModalProps {
  game: LibraryGameItem | null;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: (updated: LibraryGameItem) => void;
  onDeleted: (id: number) => void;
}

export function GameDetailModal({
  game,
  isAdmin,
  onClose,
  onUpdated,
  onDeleted,
}: GameDetailModalProps) {
  const [notes, setNotes] = useState(game?.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeShot, setActiveShot] = useState<string | null>(null);

  if (!game) return null;

  async function handleRatingChange(newRating: number | null) {
    if (!game || !isAdmin) return;
    const optimistic = { ...game, rating: newRating };
    onUpdated(optimistic);

    await fetch(`/api/library/${game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: newRating }),
    });
  }

  async function handleSaveNotes() {
    if (!game || !isAdmin) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/library/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        onUpdated({ ...game, notes });
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 1800);
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!game || !isAdmin) return;
    if (!confirm(`Remove "${game.title}" from your library?`)) return;
    const res = await fetch(`/api/library/${game.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(game.id);
      onClose();
    }
  }

  const heroImage = activeShot ?? game.backdropUrl ?? game.screenshots[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#0a0a0f] shadow-[0_30px_100px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-zinc-300 backdrop-blur-md border border-white/10 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Cinematic Hero Backdrop */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-950">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={game.title}
              fill
              className="object-cover opacity-75"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/55 to-transparent" />
        </div>

        {/* Main Content */}
        <div className="relative -mt-28 px-6 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Vertical Box Art */}
            <div className="relative h-52 w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-700/70 bg-zinc-900 shadow-2xl">
              {game.coverUrl ? (
                <Image
                  src={game.coverUrl}
                  alt={game.title}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-700">
                  <Gamepad2 className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Title, Meta & Rating */}
            <div className="flex-1 pt-2 sm:pt-10 min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
                {game.releaseYear && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900/90 border border-zinc-800 px-2 py-0.5">
                    <Calendar className="h-3 w-3 text-emerald-400" />
                    {game.releaseYear}
                  </span>
                )}
                {game.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="rounded bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {game.title}
              </h2>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Rating
                  </p>
                  <div className="mt-1">
                    <StarRating
                      value={game.rating}
                      onChange={handleRatingChange}
                      readonly={!isAdmin}
                      size="lg"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {game.summary && (
            <div className="mt-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                Overview
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {game.summary}
              </p>
            </div>
          )}

          {/* Screenshots Strip */}
          {game.screenshots.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                Screenshots
              </h3>
              <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {game.screenshots.map((shot) => (
                  <button
                    key={shot}
                    type="button"
                    onClick={() => setActiveShot(shot === activeShot ? null : shot)}
                    className={`relative aspect-video overflow-hidden rounded-lg border transition-all cursor-pointer ${
                      activeShot === shot
                        ? "border-emerald-400 ring-1 ring-emerald-400"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <Image
                      src={shot}
                      alt="Screenshot"
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {isAdmin ? (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                  Personal Notes
                </h3>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {savedToast ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" /> Save Notes
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your thoughts, favorite moments, or why you rated it this way..."
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500/50"
              />
            </div>
          ) : (
            game.notes && (
              <div className="mt-6">
                <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                  Notes
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {game.notes}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}