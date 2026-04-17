import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrRefreshTierByRiotId } from "@/lib/tierService";

type RiotIdInput = { gameName: string; tagLine: string };

function parseRiotIds(raw: unknown): RiotIdInput[] {
  if (!Array.isArray(raw)) return [];
  const out: RiotIdInput[] = [];
  for (const item of raw) {
    if (!item) continue;
    if (typeof item === "string") {
      const [name, tag] = item.split("#");
      if (name?.trim() && tag?.trim()) {
        out.push({ gameName: name.trim(), tagLine: tag.trim() });
      }
    } else if (typeof item === "object") {
      const i = item as { gameName?: unknown; tagLine?: unknown };
      if (typeof i.gameName === "string" && typeof i.tagLine === "string") {
        if (i.gameName.trim() && i.tagLine.trim()) {
          out.push({ gameName: i.gameName.trim(), tagLine: i.tagLine.trim() });
        }
      }
    }
  }
  return out;
}

async function resolveMemberPuuids(
  ids: RiotIdInput[],
  excludePuuid?: string
): Promise<string[]> {
  const puuids: string[] = [];
  const seen = new Set<string>();
  if (excludePuuid) seen.add(excludePuuid);
  for (const id of ids) {
    const cache = await getOrRefreshTierByRiotId(id.gameName, id.tagLine).catch(
      () => null
    );
    if (!cache) continue;
    if (seen.has(cache.puuid)) continue;
    seen.add(cache.puuid);
    puuids.push(cache.puuid);
  }
  return puuids;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.teamPost.findUnique({
    where: { id },
    include: { user: { select: { puuid: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, positions, maxTier, minTier, members } = body;

  const data: {
    title?: string;
    description?: string;
    positions?: string[];
    maxTier?: string | null;
    minTier?: string | null;
    memberPuuids?: string[];
  } = {};

  if (typeof title === "string") {
    if (!title.trim())
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    data.title = title.trim();
  }
  if (typeof description === "string") {
    if (!description.trim())
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    data.description = description.trim();
  }
  if (Array.isArray(positions)) data.positions = positions;
  if (maxTier !== undefined) data.maxTier = maxTier || null;
  if (minTier !== undefined) data.minTier = minTier || null;
  if (members !== undefined) {
    data.memberPuuids = await resolveMemberPuuids(
      parseRiotIds(members),
      post.user.puuid
    );
  }

  const updated = await prisma.teamPost.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const post = await prisma.teamPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  await prisma.teamPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
