import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/adminGuard";

// 공개 대회 목록 — draft는 어드민에게만 보임
export async function GET() {
  const isAdmin = await isSuperAdmin();
  const tournaments = await prisma.tournament.findMany({
    where: isAdmin ? {} : { status: { not: "draft" } },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      season: true,
      status: true,
      startDate: true,
      endDate: true,
      _count: { select: { teams: true, matches: true } },
    },
  });
  return NextResponse.json(tournaments);
}
