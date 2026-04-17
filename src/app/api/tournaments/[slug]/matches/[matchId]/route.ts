// 공개 매치 상세 — 세트/픽밴 포함.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/adminGuard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; matchId: string }> }
) {
  const { slug, matchId } = await params;
  const isAdmin = await isSuperAdmin();

  const match = await prisma.match.findFirst({
    where: { id: matchId, tournament: { slug } },
    include: {
      tournament: { select: { id: true, slug: true, name: true, status: true } },
      teamA: {
        include: { members: { orderBy: [{ isCaptain: "desc" }, { createdAt: "asc" }] } },
      },
      teamB: {
        include: { members: { orderBy: [{ isCaptain: "desc" }, { createdAt: "asc" }] } },
      },
      winnerTeam: { select: { id: true, name: true } },
      games: { orderBy: { gameNumber: "asc" } },
    },
  });
  if (!match) return NextResponse.json({ error: "없음" }, { status: 404 });
  if (match.tournament.status === "draft" && !isAdmin)
    return NextResponse.json({ error: "없음" }, { status: 404 });

  return NextResponse.json(match);
}
