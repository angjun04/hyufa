// 티어 캐시 / 갱신 / 점수 책정 서비스
// 라이엇 API 호출을 최소화하기 위한 단일 진입점.

import { prisma } from "./prisma";
import { getAccountByRiotId, getRankedInfo } from "./riot";
import { fetchPeakFromFow } from "./fow";
import { TIER_DIVISION_ORDER } from "./tierScore";
import { isS16Locked } from "./settings";
import type { TierCache } from "@prisma/client";

const DEFAULT_STALE_SECONDS = 60 * 30; // 30분
const FORCE_THROTTLE_SECONDS = 30; // force=true 여도 30초 이내면 skip

export interface TierInfo {
  tier: string | null;
  rank: string | null;
  lp: number | null;
}

export interface TierResolveResult {
  // 점수 책정에 실제로 사용할 값 — max(S15, S16)
  best: TierInfo;
  bestSeason: "S15" | "S16" | null;
  // 원본 (UI 표시용)
  s16: TierInfo;
  s15: TierInfo;
  locked: boolean;
}

function tierDivisionRank(tier: string | null, rank: string | null): number {
  if (!tier || tier === "UNRANKED") return -1;
  // 아이언/브론즈는 실버4로 간주 (LCMC 점수표상 같은 점수)
  if (tier === "IRON" || tier === "BRONZE") return 0;
  // 마스터 이상은 division 무시
  if (tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER") {
    return (
      TIER_DIVISION_ORDER.length +
      ["MASTER", "GRANDMASTER", "CHALLENGER"].indexOf(tier)
    );
  }
  const key = `${tier}_${rank}`;
  const idx = TIER_DIVISION_ORDER.indexOf(
    key as (typeof TIER_DIVISION_ORDER)[number]
  );
  return idx >= 0 ? idx : -1;
}

/** A가 B보다 높으면 양수 */
export function compareTier(a: TierInfo, b: TierInfo): number {
  const ra = tierDivisionRank(a.tier, a.rank);
  const rb = tierDivisionRank(b.tier, b.rank);
  if (ra !== rb) return ra - rb;
  return (a.lp ?? 0) - (b.lp ?? 0);
}

function isStale(refreshedAt: Date, staleSeconds: number): boolean {
  return Date.now() - refreshedAt.getTime() > staleSeconds * 1000;
}

/**
 * 처음 보는 PUUID에 대해 S15 peak를 fow.lol에서 가져와 캐시에 저장.
 * 실패해도 예외 던지지 않음.
 */
async function ensureS15CachedFor(
  puuid: string,
  gameName: string,
  tagLine: string
): Promise<void> {
  const existing = await prisma.tierCache.findUnique({
    where: { puuid },
    select: { s15FetchedAt: true, peakTierS15: true },
  });
  // 이미 시도한 적 있으면 재시도 안 함 (null도 "시도 후 없음"의 결과일 수 있음)
  if (existing?.s15FetchedAt) return;

  const s15 = await fetchPeakFromFow(gameName, tagLine, "S15").catch(() => ({
    tier: null,
    rank: null,
    lp: null,
  }));

  // upsert — 캐시 row가 없어도 만들어두기
  await prisma.tierCache.upsert({
    where: { puuid },
    create: {
      puuid,
      gameName,
      tagLine,
      peakTierS15: s15.tier,
      peakRankS15: s15.rank,
      peakLPS15: s15.lp,
      s15FetchedAt: new Date(),
    },
    update: {
      peakTierS15: s15.tier,
      peakRankS15: s15.rank,
      peakLPS15: s15.lp,
      s15FetchedAt: new Date(),
    },
  });
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

  if (cached) {
    const tooFresh = !isStale(cached.refreshedAt, FORCE_THROTTLE_SECONDS);
    if (opts.force && tooFresh) return cached;
    if (!opts.force && !isStale(cached.refreshedAt, stale)) {
      // 캐시 신선해도 S15 fetch 미완이면 한 번 해두기 (한 번만)
      if (!cached.s15FetchedAt) {
        await ensureS15CachedFor(puuid, meta.gameName, meta.tagLine);
        const refreshed = await prisma.tierCache.findUnique({ where: { puuid } });
        return refreshed ?? cached;
      }
      return cached;
    }
  }

  const snap = await getRankedInfo(meta.gameName, meta.tagLine);
  if (!snap) {
    if (cached) return cached;
    throw new Error("RIOT_ACCOUNT_NOT_FOUND");
  }

  const locked = await isS16Locked();
  const newCurrent: TierInfo = {
    tier: snap.tier,
    rank: snap.rank || null,
    lp: snap.lp,
  };
  const existingPeak: TierInfo = cached
    ? { tier: cached.peakTierS16, rank: cached.peakRankS16, lp: cached.peakLPS16 }
    : { tier: null, rank: null, lp: null };

  const shouldUpdatePeak =
    !locked && compareTier(newCurrent, existingPeak) > 0;

  // S15가 아직 안 채워졌으면 이 김에 같이
  let s15Update: {
    peakTierS15?: string | null;
    peakRankS15?: string | null;
    peakLPS15?: number | null;
    s15FetchedAt?: Date;
  } = {};
  if (!cached?.s15FetchedAt) {
    const s15 = await fetchPeakFromFow(
      meta.gameName,
      meta.tagLine,
      "S15"
    ).catch(() => ({ tier: null, rank: null, lp: null }));
    s15Update = {
      peakTierS15: s15.tier,
      peakRankS15: s15.rank,
      peakLPS15: s15.lp,
      s15FetchedAt: new Date(),
    };
  }

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
      ...s15Update,
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
      ...s15Update,
    },
  });
}

/**
 * 닉네임으로 lookup — 캐시에 puuid 없으면 account API 호출 → puuid 확보.
 */
export async function getOrRefreshTierByRiotId(
  gameName: string,
  tagLine: string,
  opts: { force?: boolean; staleSeconds?: number } = {}
): Promise<TierCache | null> {
  const cached = await prisma.tierCache.findFirst({
    where: { gameName, tagLine },
  });
  if (
    cached &&
    !opts.force &&
    !isStale(cached.refreshedAt, opts.staleSeconds ?? DEFAULT_STALE_SECONDS)
  ) {
    // S15 미완이면 한 번
    if (!cached.s15FetchedAt) {
      await ensureS15CachedFor(cached.puuid, gameName, tagLine);
      return prisma.tierCache.findUnique({ where: { puuid: cached.puuid } });
    }
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
 * 점수 책정에 사용할 "확정 티어" — S15 peak 와 S16 peak 중 더 높은 쪽.
 *
 * 회원:
 *   - S16: lock됐으면 User.peakTierS16Locked, 아니면 TierCache.peakTierS16
 *   - S15: User.peakTierS15 (fow 크롤 결과가 가입 시 저장됨)
 *
 * 비회원:
 *   - S16: TierCache.peakTierS16 (없으면 currentTier)
 *   - S15: TierCache.peakTierS15 (fow 크롤)
 */
export async function resolveScoreTier(
  puuid: string
): Promise<TierResolveResult> {
  const [user, cache] = await Promise.all([
    prisma.user.findUnique({ where: { puuid } }),
    prisma.tierCache.findUnique({ where: { puuid } }),
  ]);

  const locked = !!user?.peakLockedAt;

  // S16
  let s16: TierInfo;
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

  // S15
  const s15: TierInfo = user
    ? { tier: user.peakTierS15, rank: user.peakRankS15, lp: null }
    : {
        tier: cache?.peakTierS15 ?? null,
        rank: cache?.peakRankS15 ?? null,
        lp: cache?.peakLPS15 ?? null,
      };

  // 더 높은 쪽을 best로 선택
  const cmp = compareTier(s15, s16);
  const best = cmp > 0 ? s15 : s16;
  const bestSeason: "S15" | "S16" | null =
    tierDivisionRank(best.tier, best.rank) < 0
      ? null
      : cmp > 0
        ? "S15"
        : "S16";

  return { best, bestSeason, s16, s15, locked };
}
