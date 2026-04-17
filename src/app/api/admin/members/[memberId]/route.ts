import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { POSITIONS } from "@/lib/tournament";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { memberId } = await params;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.position !== undefined) {
    if (body.position === null || body.position === "") data.position = null;
    else {
      const p = String(body.position).toUpperCase();
      if (!(POSITIONS as readonly string[]).includes(p))
        return NextResponse.json({ error: "포지션 오류" }, { status: 400 });
      data.position = p;
    }
  }
  if (body.role !== undefined) data.role = body.role ? String(body.role).trim() : null;
  if (body.isCaptain !== undefined) data.isCaptain = !!body.isCaptain;

  try {
    const m = await prisma.teamMember.update({ where: { id: memberId }, data });
    return NextResponse.json(m);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { memberId } = await params;

  try {
    await prisma.teamMember.delete({ where: { id: memberId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
