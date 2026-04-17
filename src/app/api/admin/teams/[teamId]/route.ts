import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { teamId } = await params;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: "이름 필요" }, { status: 400 });
    data.name = v;
  }
  if (body.tag !== undefined) data.tag = body.tag ? String(body.tag).trim() : null;
  if (body.logoUrl !== undefined)
    data.logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
  if (body.description !== undefined)
    data.description = body.description ? String(body.description) : null;
  if (body.seed !== undefined) {
    if (body.seed === null || body.seed === "") data.seed = null;
    else {
      const n = parseInt(String(body.seed), 10);
      if (!Number.isFinite(n) || n < 0)
        return NextResponse.json({ error: "시드 형식 오류" }, { status: 400 });
      data.seed = n;
    }
  }

  try {
    const team = await prisma.team.update({ where: { id: teamId }, data });
    return NextResponse.json(team);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "팀 이름 중복" }, { status: 400 });
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "팀 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { teamId } = await params;

  try {
    await prisma.team.delete({ where: { id: teamId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "팀 삭제 실패" }, { status: 500 });
  }
}
