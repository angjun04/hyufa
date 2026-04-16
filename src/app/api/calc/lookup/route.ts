// 점수계산기 닉네임 모드 — 닉네임 → 점수 책정용 티어 반환
// 캐시 우선, miss/stale일 때만 라이엇 API 호출.

import { NextResponse } from "next/server";
import { getOrRefreshTierByRiotId, resolveScoreTier } from "@/lib/tierService";

export async function POST(req: Request) {
  let body: { gameName?: string; tagLine?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const gameName = String(body.gameName ?? "").trim();
  const tagLine = String(body.tagLine ?? "").trim();
  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "닉네임과 태그를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  let cache;
  try {
    cache = await getOrRefreshTierByRiotId(gameName, tagLine);
  } catch (e) {
    console.error("Lookup error:", e);
    return NextResponse.json(
      { error: "라이엇 서버 조회에 실패했습니다." },
      { status: 502 }
    );
  }
  if (!cache) {
    return NextResponse.json(
      { error: "라이엇 계정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 회원이면 lock 여부 따라 정확한 책정 티어, 비회원이면 cache 기준
  const score = await resolveScoreTier(cache.puuid);

  return NextResponse.json({
    gameName: cache.gameName,
    tagLine: cache.tagLine,
    currentTier: cache.currentTier,
    currentRank: cache.currentRank,
    // 점수 책정용 (S16 lock된 peak 또는 진행 중 peak-so-far)
    scoreTier: score.s16.tier,
    scoreRank: score.s16.rank,
    locked: score.locked,
    refreshedAt: cache.refreshedAt,
  });
}
