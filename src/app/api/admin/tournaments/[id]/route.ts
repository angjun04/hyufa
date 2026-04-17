import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { SLUG_RE, isValidStatus } from "@/lib/tournament";

// GET: 대회 + 팀/팀원 + 매치 전부 포함
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { id } = await params;

  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: {
        orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
        include: {
          members: { orderBy: [{ isCaptain: "desc" }, { createdAt: "asc" }] },
        },
      },
      matches: {
        orderBy: [{ roundOrder: "asc" }, { matchOrder: "asc" }],
        include: {
          teamA: { select: { id: true, name: true, tag: true } },
          teamB: { select: { id: true, name: true, tag: true } },
          winnerTeam: { select: { id: true, name: true } },
          _count: { select: { games: true } },
        },
      },
    },
  });
  if (!t) return NextResponse.json({ error: "없음" }, { status: 404 });
  return NextResponse.json(t);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.slug !== undefined) {
    const slug = String(body.slug).trim().toLowerCase();
    if (!SLUG_RE.test(slug))
      return NextResponse.json({ error: "slug 형식 오류" }, { status: 400 });
    data.slug = slug;
  }
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "이름 필요" }, { status: 400 });
    data.name = name;
  }
  if (body.season !== undefined)
    data.season = body.season ? String(body.season).trim() : null;
  if (body.description !== undefined)
    data.description = body.description ? String(body.description) : null;
  if (body.status !== undefined) {
    if (!isValidStatus(body.status))
      return NextResponse.json({ error: "잘못된 status" }, { status: 400 });
    data.status = body.status;
  }
  if (body.startDate !== undefined)
    data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined)
    data.endDate = body.endDate ? new Date(body.endDate) : null;

  try {
    const updated = await prisma.tournament.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "slug 중복" }, { status: 400 });
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { id } = await params;

  try {
    await prisma.tournament.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
