import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrRefreshTierByPuuid } from "@/lib/tierService";

// 내 프로필 조회 (User + TierCache)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      phoneNumber: true,
      gameName: true,
      tagLine: true,
      puuid: true,
      peakTierS15: true,
      peakRankS15: true,
      peakSourceS15: true,
      peakTierS16Locked: true,
      peakRankS16Locked: true,
      peakLPS16Locked: true,
      peakLockedAt: true,
      preferredPositions: true,
      bio: true,
      isLookingForTeam: true,
      isAdmin: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  const cache = await prisma.tierCache.findUnique({ where: { puuid: user.puuid } });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    phoneNumber: user.phoneNumber,
    gameName: user.gameName,
    tagLine: user.tagLine,
    currentTier: cache?.currentTier ?? null,
    currentRank: cache?.currentRank ?? null,
    currentLP: cache?.currentLP ?? null,
    peakTierS16: user.peakLockedAt ? user.peakTierS16Locked : cache?.peakTierS16 ?? null,
    peakRankS16: user.peakLockedAt ? user.peakRankS16Locked : cache?.peakRankS16 ?? null,
    peakLPS16: user.peakLockedAt ? user.peakLPS16Locked : cache?.peakLPS16 ?? null,
    peakLockedAt: user.peakLockedAt,
    peakTierS15: user.peakTierS15,
    peakRankS15: user.peakRankS15,
    peakSourceS15: user.peakSourceS15,
    refreshedAt: cache?.refreshedAt ?? null,
    preferredPositions: user.preferredPositions,
    bio: user.bio,
    isLookingForTeam: user.isLookingForTeam,
    isAdmin: user.isAdmin,
  });
}

// 프로필 수정 (티어/peak 관련 필드는 클라이언트가 못 바꿈)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { preferredPositions, bio, isLookingForTeam } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(preferredPositions !== undefined && { preferredPositions }),
      ...(bio !== undefined && { bio }),
      ...(isLookingForTeam !== undefined && { isLookingForTeam }),
    },
    select: { id: true, preferredPositions: true, bio: true, isLookingForTeam: true },
  });

  return NextResponse.json(user);
}

// 티어 갱신 (캐시 우선, 30초 throttle, lock 후엔 currentTier만 갱신)
export async function PUT() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { puuid: true, gameName: true, tagLine: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  try {
    const cache = await getOrRefreshTierByPuuid(
      user.puuid,
      { gameName: user.gameName, tagLine: user.tagLine },
      { force: true }
    );
    return NextResponse.json({
      currentTier: cache.currentTier,
      currentRank: cache.currentRank,
      currentLP: cache.currentLP,
      peakTierS16: cache.peakTierS16,
      peakRankS16: cache.peakRankS16,
      peakLPS16: cache.peakLPS16,
      refreshedAt: cache.refreshedAt,
    });
  } catch (e) {
    console.error("Tier refresh error:", e);
    return NextResponse.json(
      { error: "라이엇 API 조회에 실패했습니다." },
      { status: 502 }
    );
  }
}
