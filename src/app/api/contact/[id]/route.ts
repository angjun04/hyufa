import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 컨택 수락/거절
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }

  const contact = await prisma.contactRequest.findUnique({ where: { id } });
  if (!contact || contact.toUserId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const updated = await prisma.contactRequest.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
