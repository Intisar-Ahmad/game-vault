import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const games = await prisma.wantToPlay.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ games });
  } catch (err) {
    console.error("GET /api/want-to-play error:", err);
    return NextResponse.json({ error: "Failed to load want-to-play" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const body = await req.json();

    const game = await prisma.wantToPlay.create({
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
        note: body.note ?? null,
      },
    });

    return NextResponse.json({ game }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Already in Want to Play" }, { status: 409 });
    }
    console.error("POST /api/want-to-play error:", err);
    return NextResponse.json({ error: "Failed to add game" }, { status: 500 });
  }
}