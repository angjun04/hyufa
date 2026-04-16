import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const players = await prisma.user.findMany({
    where: { isLookingForTeam: true },
    select: {
      id: true,
      gameName: true,
      tagLine: true,
      puuid: true,
      peakTierS15: true,
      peakRankS15: true,
      gamesS15: true,
      peakTierS16Locked: true,
      peakRankS16Locked: true,
      peakLPS16Locked: true,
      gamesS16Locked: true,
      peakLockedAt: true,
      preferredPositions: true,
      bio: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const puuids = players.map((p) => p.puuid);
  const caches = await prisma.tierCache.findMany({
    where: { puuid: { in: puuids } },
  });
  const cacheByPuuid = new Map(caches.map((c) => [c.puuid, c]));

  const result = players.map((p) => {
    const cache = cacheByPuuid.get(p.puuid);
    return {
      id: p.id,
      gameName: p.gameName,
      tagLine: p.tagLine,
      currentTier: cache?.currentTier ?? null,
      currentRank: cache?.currentRank ?? null,
      currentLP: cache?.currentLP ?? null,
      gamesS16: p.peakLockedAt ? p.gamesS16Locked : cache?.gamesS16 ?? null,
      peakTierS16: p.peakLockedAt
        ? p.peakTierS16Locked
        : cache?.peakTierS16 ?? null,
      peakRankS16: p.peakLockedAt
        ? p.peakRankS16Locked
        : cache?.peakRankS16 ?? null,
      peakLPS16: p.peakLockedAt
        ? p.peakLPS16Locked
        : cache?.peakLPS16 ?? null,
      peakTierS15: p.peakTierS15,
      peakRankS15: p.peakRankS15,
      gamesS15: p.gamesS15,
      peakLockedAt: p.peakLockedAt,
      preferredPositions: p.preferredPositions,
      bio: p.bio,
      createdAt: p.createdAt,
    };
  });

  return NextResponse.json(result);
}
