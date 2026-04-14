import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const players = await prisma.user.findMany({
    where: { isLookingForTeam: true },
    select: {
      id: true,
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
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(players);
}
