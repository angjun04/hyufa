// 티어 캐시 / 갱신 / 점수 책정 서비스
// 라이엇 API 호출을 최소화하기 위한 단일 진입점.

import { prisma } from "./prisma";
import { getAccountByRiotId, getRankedInfo, countS15SoloGames } from "./riot";
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

export interface TierWithGames extends TierInfo {
  games: number | null;
}

export interface ScoreResolveResult {
  // 시즌별 티어 + 판수 — UI에서 포지션별 점수/패널티 계산에 사용
  s16: TierWithGames;
  s15: TierWithGames;
  locked: boolean;
}

function tierDivisionRank(tier: string | null, rank: string | null): number {
  if (!tier || tier === "UNRANKED") return -1;
  if (tier === "IRON" || tier === "BRONZE") return 0;
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
 * 처음 보는 PUUID에 대해 S15 peak + 판수를 fow.lol에서 가져와 캐시에 저장.
 * 실패해도 예외 던지지 않음.
 */
async function ensureS15CachedFor(
  puuid: string,
  gameName: string,
  tagLine: string
): Promise<void> {
  const existing = await prisma.tierCache.findUnique({
    where: { puuid },
    select: { s15FetchedAt: true },
  });
  if (existing?.s15FetchedAt) return;

  // peak (fow) + 판수 (riot match-v5) 병렬 조회
  const [peak, gamesS15] = await Promise.all([
    fetchPeakFromFow(gameName, tagLine).catch(() => ({
      tier: null,
      rank: null,
      lp: null,
    })),
    countS15SoloGames(puuid).catch(() => null),
  ]);

  await prisma.tierCache.upsert({
    where: { puuid },
    create: {
      puuid,
      gameName,
      tagLine,
      peakTierS15: peak.tier,
      peakRankS15: peak.rank,
      peakLPS15: peak.lp,
      gamesS15: gamesS15,
      s15FetchedAt: new Date(),
    },
    update: {
      peakTierS15: peak.tier,
      peakRankS15: peak.rank,
      peakLPS15: peak.lp,
      gamesS15: gamesS15,
      s15FetchedAt: new Date(),
    },
  });
}

/**
 * PUUID 기반 캐시 우선 조회. stale이거나 force면 라이엇 API 호출.
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

  // S15 peak (fow) + 판수 (riot match-v5) — 아직 안 채워졌으면 함께
  let s15Update: Partial<TierCache> = {};
  if (!cached?.s15FetchedAt) {
    const [peak, gamesS15] = await Promise.all([
      fetchPeakFromFow(meta.gameName, meta.tagLine).catch(() => ({
        tier: null,
        rank: null,
        lp: null,
      })),
      countS15SoloGames(puuid).catch(() => null),
    ]);
    s15Update = {
      peakTierS15: peak.tier,
      peakRankS15: peak.rank,
      peakLPS15: peak.lp,
      gamesS15: gamesS15,
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
      gamesS16: snap.games,
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
      gamesS16: snap.games,
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
 * 점수 책정을 위한 두 시즌 티어+판수 반환.
 * 포지션별 점수 계산은 클라이언트에서 (계산기 UI가 포지션을 알고 있음).
 *
 * 회원:
 *   S16: lock됐으면 User 스냅샷, 아니면 캐시 (peak-so-far + current games)
 *   S15: User.peakTierS15/gamesS15 (가입 시 저장)
 * 비회원:
 *   S16: 캐시의 peak/현재 + gamesS16
 *   S15: 캐시의 peakTierS15 + gamesS15 (fow 조회)
 */
export async function resolveScoreTier(
  puuid: string
): Promise<ScoreResolveResult> {
  const [user, cache] = await Promise.all([
    prisma.user.findUnique({ where: { puuid } }),
    prisma.tierCache.findUnique({ where: { puuid } }),
  ]);

  const locked = !!user?.peakLockedAt;

  // S16
  let s16: TierWithGames;
  if (locked && user) {
    s16 = {
      tier: user.peakTierS16Locked,
      rank: user.peakRankS16Locked,
      lp: user.peakLPS16Locked,
      games: user.gamesS16Locked,
    };
  } else if (cache) {
    s16 = {
      tier: cache.peakTierS16 ?? cache.currentTier,
      rank: cache.peakRankS16 ?? cache.currentRank,
      lp: cache.peakLPS16 ?? cache.currentLP,
      games: cache.gamesS16,
    };
  } else {
    s16 = { tier: null, rank: null, lp: null, games: null };
  }

  // S15
  const s15: TierWithGames = user
    ? {
        tier: user.peakTierS15,
        rank: user.peakRankS15,
        lp: null,
        games: user.gamesS15,
      }
    : {
        tier: cache?.peakTierS15 ?? null,
        rank: cache?.peakRankS15 ?? null,
        lp: cache?.peakLPS15 ?? null,
        games: cache?.gamesS15 ?? null,
      };

  return { s16, s15, locked };
}
