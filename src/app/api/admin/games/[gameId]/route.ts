import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

function validatePicks(x: unknown): boolean {
  if (x == null) return true;
  if (!Array.isArray(x)) return false;
  return x.every((e) => e && typeof e === "object");
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { gameId } = await params;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.gameNumber !== undefined) {
    const n = parseInt(String(body.gameNumber), 10);
    if (!Number.isFinite(n) || n < 1)
      return NextResponse.json({ error: "gameNumber 오류" }, { status: 400 });
    data.gameNumber = n;
  }
  if (body.blueTeamId !== undefined) data.blueTeamId = body.blueTeamId || null;
  if (body.redTeamId !== undefined) data.redTeamId = body.redTeamId || null;
  if (body.winnerSide !== undefined) {
    if (body.winnerSide === null || body.winnerSide === "") data.winnerSide = null;
    else if (body.winnerSide === "blue" || body.winnerSide === "red")
      data.winnerSide = body.winnerSide;
    else return NextResponse.json({ error: "winnerSide 오류" }, { status: 400 });
  }
  if (body.blueBans !== undefined)
    data.blueBans = Array.isArray(body.blueBans) ? body.blueBans.map(String) : [];
  if (body.redBans !== undefined)
    data.redBans = Array.isArray(body.redBans) ? body.redBans.map(String) : [];
  if (body.bluePicks !== undefined) {
    if (!validatePicks(body.bluePicks))
      return NextResponse.json({ error: "bluePicks 형식 오류" }, { status: 400 });
    data.bluePicks = body.bluePicks;
  }
  if (body.redPicks !== undefined) {
    if (!validatePicks(body.redPicks))
      return NextResponse.json({ error: "redPicks 형식 오류" }, { status: 400 });
    data.redPicks = body.redPicks;
  }
  if (body.durationSec !== undefined) {
    if (body.durationSec === null || body.durationSec === "") data.durationSec = null;
    else {
      const n = parseInt(String(body.durationSec), 10);
      if (!Number.isFinite(n) || n < 0)
        return NextResponse.json({ error: "durationSec 오류" }, { status: 400 });
      data.durationSec = n;
    }
  }
  if (body.note !== undefined) data.note = body.note ? String(body.note) : null;

  try {
    const g = await prisma.matchGame.update({ where: { id: gameId }, data });
    return NextResponse.json(g);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    if (err.code === "P2002")
      return NextResponse.json({ error: "gameNumber 중복" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "세트 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { gameId } = await params;

  try {
    await prisma.matchGame.delete({ where: { id: gameId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025")
      return NextResponse.json({ error: "없음" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "세트 삭제 실패" }, { status: 500 });
  }
}
