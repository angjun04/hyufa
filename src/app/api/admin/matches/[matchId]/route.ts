import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { id: true, name: true, slug: true } },
      teamA: {
        include: { members: { orderBy: [{ isCaptain: "desc" }, { createdAt: "asc" }] } },
      },
      teamB: {
        include: { members: { orderBy: [{ isCaptain: "desc" }, { createdAt: "asc" }] } },
      },
      winnerTeam: { select: { id: true, name: true } },
      games: { orderBy: { gameNumber: "asc" } },
    },
  });
  if (!match) return NextResponse.json({ error: "없음" }, { status: 404 });
  return NextResponse.json(match);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { matchId } = await params;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.round !== undefined) {
    const v = String(body.round).trim();
    if (!v) return NextResponse.json({ error: "라운드 필요" }, { status: 400 });
    data.round = v;
  }
  if (body.roundOrder !== undefined) {
    const n = parseInt(String(body.roundOrder), 10);
    if (!Number.isFinite(n) || n < 0)
      return NextResponse.json({ error: "roundOrder 오류" }, { status: 400 });
    data.roundOrder = n;
  }
  if (body.matchOrder !== undefined) {
    const n = parseInt(String(body.matchOrder), 10);
    if (!Number.isFinite(n) || n < 0)
      return NextResponse.json({ error: "matchOrder 오류" }, { status: 400 });
    data.matchOrder = n;
  }
  if (body.teamAId !== undefined) data.teamAId = body.teamAId || null;
  if (body.teamBId !== undefined) data.teamBId = body.teamBId || null;
  if (body.winnerTeamId !== undefined) data.winnerTeamId = body.winnerTeamId || null;
  if (body.bestOf !== undefined) {
    const n = parseInt(String(body.bestOf), 10);
    if (![1, 3, 5].includes(n))
      return NextResponse.json({ error: "bestOf 오류" }, { status: 400 });
    data.bestOf = n;
  }
  if (body.scoreA !== undefined) {
    const n = parseInt(String(body.scoreA), 10);
    if (!Number.isFinite(n) || n < 0)
      return NextResponse.json({ error: "scoreA 오류" }, { status: 400 });
    data.scoreA = n;
  }
  if (body.scoreB !== undefined) {
    const n = parseInt(String(body.scoreB), 10);
    if (!Number.isFinite(n) || n < 0)
      return NextResponse.json({ error: "scoreB 오류" }, { status: 400 });
    data.scoreB = n;
  }
  if (body.scheduledAt !== undefined)
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (body.vodUrl !== undefined)
    data.vodUrl = body.vodUrl ? String(body.vodUrl).trim() : null;
  if (body.note !== undefined) data.note = body.note ? String(body.note) : null;

  try {
    const m = await prisma.match.update({ where: { id: matchId }, data });
    return NextResponse.json(m);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    if (err.code === "P2003")
      return NextResponse.json({ error: "팀 참조 오류" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "매치 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { matchId } = await params;

  try {
    await prisma.match.delete({ where: { id: matchId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "매치 삭제 실패" }, { status: 500 });
  }
}
