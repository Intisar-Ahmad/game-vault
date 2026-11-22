import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const games = await prisma.libraryGame.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        playlists: {
          include: { playlist: true },
        },
      },
    });
    return NextResponse.json({ games });
  } catch (err) {
    console.error("GET /api/library error:", err);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const body = await req.json();

    const game = await prisma.$transaction(async (tx) => {
      await tx.wantToPlay.deleteMany({
        where: { igdbId: body.igdbId },
      });

      return tx.libraryGame.create({
        data: {
          igdbId: body.igdbId,
          title: body.title,
          slug: body.slug,
          releaseYear: body.releaseYear ?? null,
          summary: body.summary ?? null,
          coverUrl: body.coverUrl ?? null,
          backdropUrl: body.backdropUrl ?? null,
          screenshots: body.screenshots ?? [],
          genres: body.genres ?? [],
          themes: body.themes ?? [],
          similarIgdbIds: body.similarIgdbIds ?? [],
          rating: typeof body.rating === "number" ? body.rating : null,
          notes: body.notes ?? null,
        },
      });
    });

    return NextResponse.json({ game }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Game already in library" }, { status: 409 });
    }
    console.error("POST /api/library error:", err);
    return NextResponse.json({ error: "Failed to add game" }, { status: 500 });
  }
}