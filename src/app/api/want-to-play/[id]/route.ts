import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { id } = await params;
    await prisma.wantToPlay.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/want-to-play/[id] error:", err);
    return NextResponse.json({ error: "Failed to remove game" }, { status: 500 });
  }
}