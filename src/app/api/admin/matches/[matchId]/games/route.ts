import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { Prisma } from "@prisma/client";

function validatePicks(x: unknown): boolean {
  if (x == null) return true;
  if (!Array.isArray(x)) return false;
  return x.every((e) => e && typeof e === "object");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { matchId } = await params;

  const body = await req.json().catch(() => ({}));
  const gameNumber = parseInt(String(body.gameNumber ?? "1"), 10);
  if (!Number.isFinite(gameNumber) || gameNumber < 1)
    return NextResponse.json({ error: "gameNumber 오류" }, { status: 400 });

  const blueTeamId = body.blueTeamId || null;
  const redTeamId = body.redTeamId || null;
  const winnerSide = body.winnerSide === "blue" || body.winnerSide === "red" ? body.winnerSide : null;
  const blueBans = Array.isArray(body.blueBans) ? body.blueBans.map(String) : [];
  const redBans = Array.isArray(body.redBans) ? body.redBans.map(String) : [];
  const bluePicks = body.bluePicks ?? null;
  const redPicks = body.redPicks ?? null;
  if (!validatePicks(bluePicks) || !validatePicks(redPicks))
    return NextResponse.json({ error: "픽 JSON 형식 오류" }, { status: 400 });
  const durationSec =
    body.durationSec !== undefined && body.durationSec !== null && body.durationSec !== ""
      ? parseInt(String(body.durationSec), 10)
      : null;
  const note = body.note ? String(body.note) : null;

  try {
    const g = await prisma.matchGame.create({
      data: {
        matchId,
        gameNumber,
        blueTeamId,
        redTeamId,
        winnerSide,
        blueBans,
        redBans,
        bluePicks: (bluePicks ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
        redPicks: (redPicks ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
        durationSec,
        note,
      },
    });
    return NextResponse.json(g, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "이미 같은 gameNumber 존재" }, { status: 400 });
    if (err.code === "P2003")
      return NextResponse.json({ error: "매치/팀 참조 오류" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "세트 생성 실패" }, { status: 500 });
  }
}
