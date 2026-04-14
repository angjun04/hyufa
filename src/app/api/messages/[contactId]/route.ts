import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 메시지 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { contactId } = await params;

  const contact = await prisma.contactRequest.findUnique({
    where: { id: contactId },
  });
  if (
    !contact ||
    (contact.fromUserId !== session.user.id &&
      contact.toUserId !== session.user.id)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (contact.status !== "accepted") {
    return NextResponse.json(
      { error: "수락된 컨택만 채팅 가능합니다." },
      { status: 400 }
    );
  }

  const messages = await prisma.message.findMany({
    where: { contactId },
    include: {
      sender: {
        select: { id: true, gameName: true, tagLine: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// 메시지 전송
export async function POST(
  req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { contactId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "메시지를 입력해주세요." },
      { status: 400 }
    );
  }

  const contact = await prisma.contactRequest.findUnique({
    where: { id: contactId },
  });
  if (
    !contact ||
    (contact.fromUserId !== session.user.id &&
      contact.toUserId !== session.user.id)
  ) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (contact.status !== "accepted") {
    return NextResponse.json(
      { error: "수락된 컨택만 채팅 가능합니다." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      contactId,
      senderId: session.user.id,
      content: content.trim(),
    },
    include: {
      sender: {
        select: { id: true, gameName: true, tagLine: true },
      },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
