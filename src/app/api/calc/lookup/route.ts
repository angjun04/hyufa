// 점수계산기 닉네임 모드 — 닉네임 → 점수 책정용 티어/판수 반환
// 캐시 우선, miss/stale일 때만 라이엇 API / fow 호출.

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

  const score = await resolveScoreTier(cache.puuid);

  return NextResponse.json({
    gameName: cache.gameName,
    tagLine: cache.tagLine,
    currentTier: cache.currentTier,
    currentRank: cache.currentRank,
    locked: score.locked,
    refreshedAt: cache.refreshedAt,
    // 두 시즌 모두 반환 → 클라이언트가 포지션별로 점수+패널티 계산 후 min 선택
    s16: {
      tier: score.s16.tier,
      rank: score.s16.rank,
      games: score.s16.games,
    },
    s15: {
      tier: score.s15.tier,
      rank: score.s15.rank,
      games: score.s15.games,
    },
  });
}
