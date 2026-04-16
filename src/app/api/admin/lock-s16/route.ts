// S16 peak lock — 모든 User에 대해 TierCache.peakTierS16를 User.peakTierS16Locked로 복사
// + AppSetting "S16_LOCKED" = "true" 설정.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { setSetting, SETTING_KEYS } from "@/lib/settings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as "lock" | "unlock" | undefined;

  if (action === "unlock") {
    // 락 해제: User.peakLockedAt만 null로 (기존 lock 값은 보존)
    await prisma.user.updateMany({
      data: { peakLockedAt: null },
    });
    await setSetting(SETTING_KEYS.S16_LOCKED, "false");
    return NextResponse.json({ ok: true, locked: false });
  }

  // lock: TierCache.peakTierS16 → User.peakTierS16Locked
  const now = new Date();
  const users = await prisma.user.findMany({ select: { id: true, puuid: true } });
  const caches = await prisma.tierCache.findMany({
    where: { puuid: { in: users.map((u) => u.puuid) } },
    select: {
      puuid: true,
      peakTierS16: true,
      peakRankS16: true,
      peakLPS16: true,
      currentTier: true,
      currentRank: true,
      currentLP: true,
    },
  });
  const cacheByPuuid = new Map(caches.map((c) => [c.puuid, c]));

  // 한 트랜잭션으로 일괄 업데이트
  await prisma.$transaction(
    users.map((u) => {
      const c = cacheByPuuid.get(u.puuid);
      // 캐시 없는 사용자는 lock 시 peak NULL — 점수 계산 시 그냥 0점
      const tier = c?.peakTierS16 ?? c?.currentTier ?? null;
      const rank = c?.peakRankS16 ?? c?.currentRank ?? null;
      const lp = c?.peakLPS16 ?? c?.currentLP ?? null;
      return prisma.user.update({
        where: { id: u.id },
        data: {
          peakTierS16Locked: tier,
          peakRankS16Locked: rank,
          peakLPS16Locked: lp,
          peakLockedAt: now,
        },
      });
    })
  );

  await setSetting(SETTING_KEYS.S16_LOCKED, "true");

  return NextResponse.json({
    ok: true,
    locked: true,
    lockedAt: now.toISOString(),
    userCount: users.length,
  });
}
