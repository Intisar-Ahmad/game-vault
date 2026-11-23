import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
    const limit = Math.min(60, Math.max(1, Number(params.get("limit") ?? "24") || 24));
    const q = params.get("q")?.trim() ?? "";
    const genre = params.get("genre")?.trim() ?? "all";

    const where: Prisma.WantToPlayWhereInput = {};
    if (q) {
      where.title = { contains: q, mode: "insensitive" };
    }
    if (genre && genre !== "all") {
      where.genres = { has: genre };
    }

    const [games, filteredCount, totalCount, genreRows] = await Promise.all([
      prisma.wantToPlay.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wantToPlay.count({ where }),
      prisma.wantToPlay.count(),
      prisma.wantToPlay.findMany({
        select: { genres: true },
      }),
    ]);

    const genreSet = new Set<string>();
    for (const row of genreRows) {
      for (const g of row.genres) genreSet.add(g);
    }

    return NextResponse.json({
      games,
      totalCount,
      filteredCount,
      genres: Array.from(genreSet).sort(),
      hasMore: page * limit < filteredCount,
    });
  } catch (err) {
    console.error("GET /api/want-to-play error:", err);
    return NextResponse.json({ error: "Failed to load want-to-play" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
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