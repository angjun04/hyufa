// 공개 대회 상세 — 팀/팀원(+ 티어 캐시)/매치 포함.
// 어드민 아니면 draft 숨김.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/adminGuard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const isAdmin = await isSuperAdmin();

  const t = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      teams: {
        orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
        include: {
          members: { orderBy: [{ isCaptain: "desc" }, { createdAt: "asc" }] },
        },
      },
      matches: {
        orderBy: [{ roundOrder: "asc" }, { matchOrder: "asc" }],
        include: {
          teamA: { select: { id: true, name: true, tag: true } },
          teamB: { select: { id: true, name: true, tag: true } },
          winnerTeam: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!t) return NextResponse.json({ error: "없음" }, { status: 404 });
  if (t.status === "draft" && !isAdmin)
    return NextResponse.json({ error: "없음" }, { status: 404 });

  // 팀원 puuid로 TierCache 조회 → 각 멤버에 currentTier/peakTierS16/S15 주입
  const puuids = t.teams.flatMap((tm) =>
    tm.members.map((m) => m.puuid).filter((p): p is string => !!p)
  );
  const caches = puuids.length
    ? await prisma.tierCache.findMany({
        where: { puuid: { in: puuids } },
        select: {
          puuid: true,
          currentTier: true,
          currentRank: true,
          currentLP: true,
          peakTierS16: true,
          peakRankS16: true,
          peakTierS15: true,
          peakRankS15: true,
        },
      })
    : [];
  const cacheMap = new Map(caches.map((c) => [c.puuid, c]));

  const enrichedTeams = t.teams.map((tm) => ({
    ...tm,
    members: tm.members.map((m) => ({
      ...m,
      tier: m.puuid ? cacheMap.get(m.puuid) ?? null : null,
    })),
  }));

  return NextResponse.json({ ...t, teams: enrichedTeams });
}
