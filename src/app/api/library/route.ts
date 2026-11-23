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
    const sort = params.get("sort") ?? "recent";

    const where: Prisma.LibraryGameWhereInput = {};
    if (q) {
      where.title = { contains: q, mode: "insensitive" };
    }
    if (genre && genre !== "all") {
      where.genres = { has: genre };
    }

    let orderBy: Prisma.LibraryGameOrderByWithRelationInput | Prisma.LibraryGameOrderByWithRelationInput[] =
      { createdAt: "desc" };

    if (sort === "rating") {
      orderBy = [{ rating: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    } else if (sort === "year") {
      orderBy = [{ releaseYear: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    } else if (sort === "title") {
      orderBy = { title: "asc" };
    }

    const [games, filteredCount, totalCount, ratingAgg, genreRows] = await Promise.all([
      prisma.libraryGame.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          playlists: {
            include: { playlist: true },
          },
        },
      }),
      prisma.libraryGame.count({ where }),
      prisma.libraryGame.count(),
      prisma.libraryGame.aggregate({
        _avg: { rating: true },
        where: { rating: { not: null } },
      }),
      prisma.libraryGame.findMany({
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
      avgRating: ratingAgg._avg.rating ? ratingAgg._avg.rating.toFixed(2) : null,
      genres: Array.from(genreSet).sort(),
      hasMore: page * limit < filteredCount,
    });
  } catch (err) {
    console.error("GET /api/library error:", err);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
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