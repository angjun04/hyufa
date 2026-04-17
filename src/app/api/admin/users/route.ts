// 어드민용 사용자 목록 — 한 화면에 보기 위한 단순 조회
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  }

  const users = await prisma.user.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      gameName: true,
      tagLine: true,
      puuid: true,
      phoneNumber: true,
      peakTierS15: true,
      peakRankS15: true,
      peakTierS16Locked: true,
      peakRankS16Locked: true,
      peakLockedAt: true,
      createdAt: true,
    },
  });

  const caches = await prisma.tierCache.findMany({
    where: { puuid: { in: users.map((u) => u.puuid) } },
    select: {
      puuid: true,
      currentTier: true,
      currentRank: true,
      peakTierS16: true,
      peakRankS16: true,
      refreshedAt: true,
    },
  });
  const byPuuid = new Map(caches.map((c) => [c.puuid, c]));

  return NextResponse.json(
    users.map((u) => {
      const c = byPuuid.get(u.puuid);
      return {
        id: u.id,
        username: u.username,
        gameName: u.gameName,
        tagLine: u.tagLine,
        phoneNumber: u.phoneNumber,
        currentTier: c?.currentTier ?? null,
        currentRank: c?.currentRank ?? null,
        peakTierS16: u.peakLockedAt
          ? u.peakTierS16Locked
          : c?.peakTierS16 ?? null,
        peakRankS16: u.peakLockedAt
          ? u.peakRankS16Locked
          : c?.peakRankS16 ?? null,
        peakLockedAt: u.peakLockedAt,
        peakTierS15: u.peakTierS15,
        peakRankS15: u.peakRankS15,
        refreshedAt: c?.refreshedAt ?? null,
        createdAt: u.createdAt,
      };
    })
  );
}
