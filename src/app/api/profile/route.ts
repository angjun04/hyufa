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
      gamesS15: true,
      peakTierS16Locked: true,
      peakRankS16Locked: true,
      peakLPS16Locked: true,
      gamesS16Locked: true,
      peakLockedAt: true,
      preferredPositions: true,
      bio: true,
      isLookingForTeam: true,
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
    gamesS16: user.peakLockedAt ? user.gamesS16Locked : cache?.gamesS16 ?? null,
    peakTierS16: user.peakLockedAt ? user.peakTierS16Locked : cache?.peakTierS16 ?? null,
    peakRankS16: user.peakLockedAt ? user.peakRankS16Locked : cache?.peakRankS16 ?? null,
    peakLPS16: user.peakLockedAt ? user.peakLPS16Locked : cache?.peakLPS16 ?? null,
    peakLockedAt: user.peakLockedAt,
    peakTierS15: user.peakTierS15,
    peakRankS15: user.peakRankS15,
    peakSourceS15: user.peakSourceS15,
    gamesS15: user.gamesS15,
    refreshedAt: cache?.refreshedAt ?? null,
    preferredPositions: user.preferredPositions,
    bio: user.bio,
    isLookingForTeam: user.isLookingForTeam,
  });
}

// 프로필 수정
// 대부분의 티어 필드는 서버에서 자동 책정. 예외: S15 peak는 fow.kr에 색인 안 된
// 소환사를 위해 수동 입력을 허용한다 (peakSourceS15="manual"로 표시).
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const {
    preferredPositions,
    bio,
    isLookingForTeam,
    peakTierS15,
    peakRankS15,
    gamesS15,
  } = body;

  // S15 peak 검증
  const allowedTiers = [
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "EMERALD",
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
  ];
  const allowedRanks = ["I", "II", "III", "IV"];
  const highTier = ["MASTER", "GRANDMASTER", "CHALLENGER"];

  const s15Update: {
    peakTierS15?: string | null;
    peakRankS15?: string | null;
    peakSourceS15?: string | null;
  } = {};
  if (peakTierS15 !== undefined) {
    if (peakTierS15 === null || peakTierS15 === "") {
      s15Update.peakTierS15 = null;
      s15Update.peakRankS15 = null;
      s15Update.peakSourceS15 = null;
    } else {
      if (!allowedTiers.includes(peakTierS15)) {
        return NextResponse.json(
          { error: "올바른 티어가 아닙니다." },
          { status: 400 }
        );
      }
      if (highTier.includes(peakTierS15)) {
        s15Update.peakTierS15 = peakTierS15;
        s15Update.peakRankS15 = null;
      } else {
        if (!peakRankS15 || !allowedRanks.includes(peakRankS15)) {
          return NextResponse.json(
            { error: "단계(I~IV)를 선택해주세요." },
            { status: 400 }
          );
        }
        s15Update.peakTierS15 = peakTierS15;
        s15Update.peakRankS15 = peakRankS15;
      }
      s15Update.peakSourceS15 = "manual";
    }
  }

  // S15 판수 수동 입력 (0 이상 정수, null로 초기화 가능)
  let gamesS15Update: { gamesS15?: number | null } = {};
  if (gamesS15 !== undefined) {
    if (gamesS15 === null || gamesS15 === "") {
      gamesS15Update = { gamesS15: null };
    } else {
      const n = parseInt(String(gamesS15), 10);
      if (!Number.isFinite(n) || n < 0 || n > 99999) {
        return NextResponse.json(
          { error: "판수는 0 이상 99999 이하 정수여야 합니다." },
          { status: 400 }
        );
      }
      gamesS15Update = { gamesS15: n };
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(preferredPositions !== undefined && { preferredPositions }),
      ...(bio !== undefined && { bio }),
      ...(isLookingForTeam !== undefined && { isLookingForTeam }),
      ...s15Update,
      ...gamesS15Update,
    },
    select: {
      id: true,
      preferredPositions: true,
      bio: true,
      isLookingForTeam: true,
      peakTierS15: true,
      peakRankS15: true,
      peakSourceS15: true,
      gamesS15: true,
    },
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
