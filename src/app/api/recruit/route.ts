import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.teamPost.findMany({
    include: {
      user: {
        select: {
          id: true,
          gameName: true,
          tagLine: true,
          currentTier: true,
          currentRank: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { title, description, positions, maxTier, minTier } = await req.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "제목과 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const post = await prisma.teamPost.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description.trim(),
      positions: positions || [],
      maxTier: maxTier || null,
      minTier: minTier || null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
