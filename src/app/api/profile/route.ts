import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRankedInfo } from "@/lib/riot";

// 내 프로필 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      gameName: true,
      tagLine: true,
      currentTier: true,
      currentRank: true,
      currentLP: true,
      peakTierS15: true,
      peakRankS15: true,
      peakTierS16: true,
      peakRankS16: true,
      preferredPositions: true,
      bio: true,
      isLookingForTeam: true,
    },
  });

  return NextResponse.json(user);
}

// 프로필 수정
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { preferredPositions, bio, isLookingForTeam, peakTierS15, peakRankS15 } =
    body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(preferredPositions !== undefined && { preferredPositions }),
      ...(bio !== undefined && { bio }),
      ...(isLookingForTeam !== undefined && { isLookingForTeam }),
      ...(peakTierS15 !== undefined && { peakTierS15 }),
      ...(peakRankS15 !== undefined && { peakRankS15 }),
    },
  });

  return NextResponse.json(user);
}

// 티어 갱신 (Riot API)
export async function PUT() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const riotData = await getRankedInfo(user.gameName, user.tagLine);
  if (!riotData) {
    return NextResponse.json(
      { error: "라이엇 API 조회에 실패했습니다." },
      { status: 500 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      puuid: riotData.puuid,
      summonerId: riotData.summonerId,
      currentTier: riotData.tier,
      currentRank: riotData.rank,
      currentLP: riotData.lp,
    },
  });

  return NextResponse.json({
    currentTier: updated.currentTier,
    currentRank: updated.currentRank,
    currentLP: updated.currentLP,
  });
}
