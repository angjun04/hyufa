import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { id: tournamentId } = await params;

  const body = await req.json().catch(() => ({}));
  const round = String(body.round ?? "").trim();
  const roundOrder = parseInt(String(body.roundOrder ?? "1"), 10);
  const matchOrder = parseInt(String(body.matchOrder ?? "1"), 10);
  const teamAId = body.teamAId ? String(body.teamAId) : null;
  const teamBId = body.teamBId ? String(body.teamBId) : null;
  const bestOf = body.bestOf ? parseInt(String(body.bestOf), 10) : 1;
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  const vodUrl = body.vodUrl ? String(body.vodUrl).trim() : null;
  const note = body.note ? String(body.note) : null;

  if (!round) return NextResponse.json({ error: "라운드 이름 필요" }, { status: 400 });
  if (!Number.isFinite(roundOrder) || roundOrder < 0 || !Number.isFinite(matchOrder) || matchOrder < 0)
    return NextResponse.json({ error: "순서 값 오류" }, { status: 400 });
  if (![1, 3, 5].includes(bestOf))
    return NextResponse.json({ error: "bestOf는 1/3/5" }, { status: 400 });

  try {
    const m = await prisma.match.create({
      data: {
        tournamentId,
        round,
        roundOrder,
        matchOrder,
        teamAId,
        teamBId,
        bestOf,
        scheduledAt,
        vodUrl,
        note,
      },
    });
    return NextResponse.json(m, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2003")
      return NextResponse.json({ error: "대회/팀 참조 오류" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "매치 생성 실패" }, { status: 500 });
  }
}
