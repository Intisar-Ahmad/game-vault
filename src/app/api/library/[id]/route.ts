import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const gameId = Number(id);
    const body = await req.json();

    const data: { rating?: number | null; notes?: string | null } = {};
    if ("rating" in body) {
      data.rating = body.rating === null ? null : Number(body.rating);
    }
    if ("notes" in body) {
      data.notes = body.notes;
    }

    const game = await prisma.libraryGame.update({
      where: { id: gameId },
      data,
    });

    return NextResponse.json({ game });
  } catch (err) {
    console.error("PATCH /api/library/[id] error:", err);
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    await prisma.libraryGame.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/library/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}