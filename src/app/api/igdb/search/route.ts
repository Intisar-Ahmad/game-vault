import { NextRequest, NextResponse } from "next/server";
import { igdbQuery, formatIgdbImage } from "@/lib/igdb";
import { prisma } from "@/lib/prisma";

interface RawIgdbGame {
  id: number;
  name: string;
  slug: string;
  first_release_date?: number;
  summary?: string;
  cover?: { image_id: string };
  screenshots?: { image_id: string }[];
  artworks?: { image_id: string }[];
  genres?: { name: string }[];
  themes?: { name: string }[];
  similar_games?: number[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const safeQuery = q.replace(/"/g, '\\"');
    const igdbBody = `
      search "${safeQuery}";
      fields name, slug, first_release_date, summary,
             cover.image_id, screenshots.image_id, artworks.image_id,
             genres.name, themes.name, similar_games;
      where version_parent = null;
      limit 12;
    `;

    const rawGames = await igdbQuery<RawIgdbGame>("games", igdbBody);
    const ids = rawGames.map((g) => g.id);

    const [existingLibrary, existingWantToPlay] = await Promise.all([
      prisma.libraryGame.findMany({
        where: { igdbId: { in: ids } },
        select: { igdbId: true },
      }),
      prisma.wantToPlay.findMany({
        where: { igdbId: { in: ids } },
        select: { igdbId: true },
      }),
    ]);

    const librarySet = new Set(existingLibrary.map((g) => g.igdbId));
    const wantSet = new Set(existingWantToPlay.map((g) => g.igdbId));

    const results = rawGames.map((g) => {
      const screenshots = (g.screenshots ?? [])
        .slice(0, 6)
        .map((s) => formatIgdbImage(s.image_id, "screenshot_big"))
        .filter((url): url is string => Boolean(url));

      const backdropId = g.artworks?.[0]?.image_id ?? g.screenshots?.[0]?.image_id;

      return {
        igdbId: g.id,
        title: g.name,
        slug: g.slug,
        releaseYear: g.first_release_date
          ? new Date(g.first_release_date * 1000).getFullYear()
          : null,
        summary: g.summary ?? null,
        coverUrl: formatIgdbImage(g.cover?.image_id, "cover_big"),
        backdropUrl: formatIgdbImage(backdropId, "1080p"),
        screenshots,
        genres: (g.genres ?? []).map((genre) => genre.name),
        themes: (g.themes ?? []).map((theme) => theme.name),
        similarIgdbIds: (g.similar_games ?? []).slice(0, 15),
        inLibrary: librarySet.has(g.id),
        inWantToPlay: wantSet.has(g.id),
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("IGDB search error:", err);
    return NextResponse.json(
      { error: "Failed to search IGDB" },
      { status: 500 }
    );
  }
}