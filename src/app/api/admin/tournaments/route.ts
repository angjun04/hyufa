import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { SLUG_RE, isValidStatus } from "@/lib/tournament";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });

  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { teams: true, matches: true } },
    },
  });
  return NextResponse.json(tournaments);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const season = body.season ? String(body.season).trim() : null;
  const description = body.description ? String(body.description) : null;
  const status = body.status && isValidStatus(body.status) ? body.status : "draft";
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;

  if (!name) return NextResponse.json({ error: "대회 이름이 필요합니다." }, { status: 400 });
  if (!SLUG_RE.test(slug))
    return NextResponse.json(
      { error: "slug는 영소문자/숫자/하이픈 3~40자여야 합니다." },
      { status: 400 }
    );

  try {
    const created = await prisma.tournament.create({
      data: { slug, name, season, description, status, startDate, endDate },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "이미 사용 중인 slug입니다." }, { status: 400 });
    }
    console.error("tournament create error:", e);
    return NextResponse.json({ error: "대회 생성 실패" }, { status: 500 });
  }
}
