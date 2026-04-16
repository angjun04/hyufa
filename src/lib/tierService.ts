// 티어 캐시 / 갱신 / 점수 책정 서비스
// 라이엇 API 호출을 최소화하기 위한 단일 진입점.

import { prisma } from "./prisma";
import { getAccountByRiotId, getRankedInfo } from "./riot";
import { TIER_DIVISION_ORDER } from "./tierScore";
import { isS16Locked } from "./settings";
import type { TierCache } from "@prisma/client";

const DEFAULT_STALE_SECONDS = 60 * 30; // 30분
const FORCE_THROTTLE_SECONDS = 30; // force=true 여도 30초 이내면 skip

export interface TierResolveResult {
  s16: { tier: string | null; rank: string | null; lp: number | null };
  s15: { tier: string | null; rank: string | null } | null;
  locked: boolean;
}

function tierDivisionRank(tier: string | null, rank: string | null): number {
  if (!tier || tier === "UNRANKED") return -1;
  // 마스터 이상은 division 무시
  if (tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER") {
    return TIER_DIVISION_ORDER.length + ["MASTER", "GRANDMASTER", "CHALLENGER"].indexOf(tier);
  }
  const key = `${tier}_${rank}`;
  return TIER_DIVISION_ORDER.indexOf(key as (typeof TIER_DIVISION_ORDER)[number]);
}

/** A가 B보다 높으면 양수 */
export function compareTier(
  a: { tier: string | null; rank: string | null; lp: number | null },
  b: { tier: string | null; rank: string | null; lp: number | null }
): number {
  const ra = tierDivisionRank(a.tier, a.rank);
  const rb = tierDivisionRank(b.tier, b.rank);
  if (ra !== rb) return ra - rb;
  return (a.lp ?? 0) - (b.lp ?? 0);
}

function isStale(refreshedAt: Date, staleSeconds: number): boolean {
  return Date.now() - refreshedAt.getTime() > staleSeconds * 1000;
}

/**
 * PUUID 기반 캐시 우선 조회. stale이거나 force면 라이엇 API 호출.
 * 라이엇 호출 결과는 TierCache에 upsert되며 peak는 누적 max로 갱신된다.
 */
export async function getOrRefreshTierByPuuid(
  puuid: string,
  meta: { gameName: string; tagLine: string },
  opts: { force?: boolean; staleSeconds?: number } = {}
): Promise<TierCache> {
  const stale = opts.staleSeconds ?? DEFAULT_STALE_SECONDS;
  const cached = await prisma.tierCache.findUnique({ where: { puuid } });

  // 시즌 lock된 상태면 라이엇 호출 안 함 (currentTier만 갱신하고 싶다면 제거)
  // 단, currentTier 표시는 lock 후에도 갱신 가능하게 하려고 lock 무시하고 호출 허용.

  if (cached) {
    const tooFresh = !isStale(cached.refreshedAt, FORCE_THROTTLE_SECONDS);
    if (opts.force && tooFresh) return cached;
    if (!opts.force && !isStale(cached.refreshedAt, stale)) return cached;
  }

  const snap = await getRankedInfo(meta.gameName, meta.tagLine);
  if (!snap) {
    // 계정 자체가 사라진 경우 — 캐시가 있으면 그대로 반환
    if (cached) return cached;
    throw new Error("RIOT_ACCOUNT_NOT_FOUND");
  }

  const locked = await isS16Locked();
  // peak 누적: 새 currentTier가 기존 peak보다 높으면 갱신 (lock 상태면 peak 갱신 X)
  const newCurrent = {
    tier: snap.tier,
    rank: snap.rank || null,
    lp: snap.lp,
  };
  const existingPeak = cached
    ? { tier: cached.peakTierS16, rank: cached.peakRankS16, lp: cached.peakLPS16 }
    : { tier: null, rank: null, lp: null };

  const shouldUpdatePeak =
    !locked && compareTier(newCurrent, existingPeak) > 0;

  return prisma.tierCache.upsert({
    where: { puuid },
    create: {
      puuid,
      gameName: meta.gameName,
      tagLine: meta.tagLine,
      currentTier: snap.tier,
      currentRank: snap.rank || null,
      currentLP: snap.lp,
      peakTierS16: snap.tier === "UNRANKED" ? null : snap.tier,
      peakRankS16: snap.tier === "UNRANKED" ? null : snap.rank || null,
      peakLPS16: snap.tier === "UNRANKED" ? null : snap.lp,
    },
    update: {
      gameName: meta.gameName,
      tagLine: meta.tagLine,
      currentTier: snap.tier,
      currentRank: snap.rank || null,
      currentLP: snap.lp,
      ...(shouldUpdatePeak
        ? {
            peakTierS16: newCurrent.tier,
            peakRankS16: newCurrent.rank,
            peakLPS16: newCurrent.lp,
          }
        : {}),
    },
  });
}

/**
 * 닉네임으로 lookup (점수계산기 닉네임 모드용).
 * 캐시에 puuid 없으면 account API 호출 → puuid 확보 후 위 함수 호출.
 */
export async function getOrRefreshTierByRiotId(
  gameName: string,
  tagLine: string,
  opts: { force?: boolean; staleSeconds?: number } = {}
): Promise<TierCache | null> {
  // gameName+tagLine로 먼저 캐시 조회 (puuid 모를 때)
  const cached = await prisma.tierCache.findFirst({
    where: { gameName, tagLine },
  });
  if (cached && !opts.force && !isStale(cached.refreshedAt, opts.staleSeconds ?? DEFAULT_STALE_SECONDS)) {
    return cached;
  }

  const account = await getAccountByRiotId(gameName, tagLine);
  if (!account) return null;

  return getOrRefreshTierByPuuid(
    account.puuid,
    { gameName: account.gameName, tagLine: account.tagLine },
    opts
  );
}

/**
 * 점수 책정에 사용할 "확정 티어" — User가 등록되어 있다면 lock된 peak를,
 * 비회원이면 currentTier를 사용한다. S15 peak는 별도로 함께 반환.
 */
export async function resolveScoreTier(
  puuid: string
): Promise<TierResolveResult> {
  const [user, cache] = await Promise.all([
    prisma.user.findUnique({ where: { puuid } }),
    prisma.tierCache.findUnique({ where: { puuid } }),
  ]);

  const locked = !!user?.peakLockedAt;

  // S16 책정
  let s16: TierResolveResult["s16"];
  if (locked && user) {
    s16 = {
      tier: user.peakTierS16Locked,
      rank: user.peakRankS16Locked,
      lp: user.peakLPS16Locked,
    };
  } else if (cache) {
    s16 = {
      tier: cache.peakTierS16 ?? cache.currentTier,
      rank: cache.peakRankS16 ?? cache.currentRank,
      lp: cache.peakLPS16 ?? cache.currentLP,
    };
  } else {
    s16 = { tier: null, rank: null, lp: null };
  }

  const s15 = user
    ? { tier: user.peakTierS15, rank: user.peakRankS15 }
    : null;

  return { s16, s15, locked };
}
