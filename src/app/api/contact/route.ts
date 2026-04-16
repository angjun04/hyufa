import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 컨택 신청
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { toUserId, teamPostId, type } = await req.json();

  if (session.user.id === toUserId) {
    return NextResponse.json(
      { error: "자신에게 컨택할 수 없습니다." },
      { status: 400 }
    );
  }

  // 중복 신청 방지
  const existing = await prisma.contactRequest.findFirst({
    where: {
      fromUserId: session.user.id,
      toUserId,
      teamPostId: teamPostId || null,
      status: { in: ["pending", "accepted"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 신청한 컨택입니다." },
      { status: 400 }
    );
  }

  const contact = await prisma.contactRequest.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      teamPostId: teamPostId || null,
      type,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}

// 내 컨택 목록
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const contacts = await prisma.contactRequest.findMany({
    where: {
      OR: [{ fromUserId: session.user.id }, { toUserId: session.user.id }],
    },
    include: {
      fromUser: {
        select: {
          id: true,
          gameName: true,
          tagLine: true,
          puuid: true,
          preferredPositions: true,
        },
      },
      toUser: {
        select: {
          id: true,
          gameName: true,
          tagLine: true,
          puuid: true,
          preferredPositions: true,
        },
      },
      teamPost: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 캐시 join — currentTier/currentRank 채우기
  const puuids = Array.from(
    new Set(contacts.flatMap((c) => [c.fromUser.puuid, c.toUser.puuid]))
  );
  const caches = await prisma.tierCache.findMany({
    where: { puuid: { in: puuids } },
    select: { puuid: true, currentTier: true, currentRank: true },
  });
  const cacheByPuuid = new Map(caches.map((c) => [c.puuid, c]));

  const decorated = contacts.map((c) => ({
    ...c,
    fromUser: {
      id: c.fromUser.id,
      gameName: c.fromUser.gameName,
      tagLine: c.fromUser.tagLine,
      currentTier: cacheByPuuid.get(c.fromUser.puuid)?.currentTier ?? null,
      currentRank: cacheByPuuid.get(c.fromUser.puuid)?.currentRank ?? null,
      preferredPositions: c.fromUser.preferredPositions,
    },
    toUser: {
      id: c.toUser.id,
      gameName: c.toUser.gameName,
      tagLine: c.toUser.tagLine,
      currentTier: cacheByPuuid.get(c.toUser.puuid)?.currentTier ?? null,
      currentRank: cacheByPuuid.get(c.toUser.puuid)?.currentRank ?? null,
      preferredPositions: c.toUser.preferredPositions,
    },
  }));

  return NextResponse.json(decorated);
}
