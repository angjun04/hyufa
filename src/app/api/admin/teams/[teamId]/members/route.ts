// 팀원 추가 — 라이엇 ID 입력 시 내부 API로 puuid/티어 캐시 확보 시도.
// 조회 실패해도 팀원은 등록 (puuid null 상태로).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { getOrRefreshTierByRiotId } from "@/lib/tierService";
import { POSITIONS } from "@/lib/tournament";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { teamId } = await params;

  const body = await req.json().catch(() => ({}));
  const gameName = String(body.gameName ?? "").trim();
  const tagLine = String(body.tagLine ?? "").trim();
  const position = body.position ? String(body.position).trim().toUpperCase() : null;
  const role = body.role ? String(body.role).trim() : null;
  const isCaptain = !!body.isCaptain;

  if (!gameName || !tagLine)
    return NextResponse.json({ error: "닉네임/태그 필요" }, { status: 400 });
  if (position && !(POSITIONS as readonly string[]).includes(position))
    return NextResponse.json({ error: "포지션 형식 오류" }, { status: 400 });

  // 팀 존재 확인
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "팀 없음" }, { status: 404 });

  // 라이엇 조회 — 실패해도 등록 계속
  let puuid: string | null = null;
  let warning: string | null = null;
  try {
    const cache = await getOrRefreshTierByRiotId(gameName, tagLine);
    if (cache) puuid = cache.puuid;
    else warning = "라이엇 계정을 찾지 못했습니다. 닉네임을 확인해주세요.";
  } catch (e) {
    console.error("riot lookup during member add:", e);
    warning = "라이엇 서버 조회 실패 — puuid 없이 등록됩니다.";
  }

  // 회원이면 user 연결
  let userId: string | null = null;
  if (puuid) {
    const user = await prisma.user.findUnique({ where: { puuid }, select: { id: true } });
    if (user) userId = user.id;
  }

  try {
    const member = await prisma.teamMember.create({
      data: { teamId, userId, gameName, tagLine, puuid, position, role, isCaptain },
    });
    return NextResponse.json({ member, warning }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "같은 라이엇 ID가 이미 등록됨" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "팀원 추가 실패" }, { status: 500 });
  }
}
