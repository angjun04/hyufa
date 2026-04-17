import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

// 팀 생성 (비어있는 상태로 — 팀원은 별도 API로 추가)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  const { id: tournamentId } = await params;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const tag = body.tag ? String(body.tag).trim() : null;
  const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
  const description = body.description ? String(body.description) : null;
  const seed =
    body.seed !== undefined && body.seed !== null && body.seed !== ""
      ? parseInt(String(body.seed), 10)
      : null;

  if (!name) return NextResponse.json({ error: "팀 이름 필요" }, { status: 400 });
  if (seed !== null && (!Number.isFinite(seed) || seed < 0))
    return NextResponse.json({ error: "시드는 0 이상 정수" }, { status: 400 });

  try {
    const team = await prisma.team.create({
      data: { tournamentId, name, tag, logoUrl, description, seed },
    });
    return NextResponse.json(team, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "같은 이름의 팀이 이미 있습니다." }, { status: 400 });
    if (err.code === "P2003")
      return NextResponse.json({ error: "대회가 없습니다." }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "팀 생성 실패" }, { status: 500 });
  }
}
