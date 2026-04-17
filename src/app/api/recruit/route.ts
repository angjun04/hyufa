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

/**
 * Riot ID 배열 → PUUID 배열. 각 ID마다 TierCache 캐시 우선, 없으면 API + 캐싱.
 * 실패(존재하지 않는 계정)는 스킵.
 */
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

export async function GET() {
  const posts = await prisma.teamPost.findMany({
    include: {
      user: {
        select: {
          id: true,
          gameName: true,
          tagLine: true,
          puuid: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const puuidSet = new Set<string>();
  for (const p of posts) {
    puuidSet.add(p.user.puuid);
    for (const m of p.memberPuuids) puuidSet.add(m);
  }
  const caches = await prisma.tierCache.findMany({
    where: { puuid: { in: Array.from(puuidSet) } },
  });
  const cacheByPuuid = new Map(caches.map((c) => [c.puuid, c]));

  const result = posts.map((p) => {
    const leaderCache = cacheByPuuid.get(p.user.puuid);
    const members = p.memberPuuids
      .map((puuid) => {
        const c = cacheByPuuid.get(puuid);
        if (!c) return null;
        return {
          puuid: c.puuid,
          gameName: c.gameName,
          tagLine: c.tagLine,
          currentTier: c.currentTier,
          currentRank: c.currentRank,
          currentLP: c.currentLP,
          peakTierS16: c.peakTierS16,
          peakRankS16: c.peakRankS16,
          peakTierS15: c.peakTierS15,
          peakRankS15: c.peakRankS15,
        };
      })
      .filter(Boolean);
    return {
      ...p,
      user: {
        id: p.user.id,
        gameName: p.user.gameName,
        tagLine: p.user.tagLine,
        currentTier: leaderCache?.currentTier ?? null,
        currentRank: leaderCache?.currentRank ?? null,
        preferredPositions: [],
      },
      members,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, positions, maxTier, minTier, members } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "제목과 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { puuid: true },
  });

  const memberPuuids = await resolveMemberPuuids(
    parseRiotIds(members),
    me?.puuid
  );

  const post = await prisma.teamPost.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description.trim(),
      positions: positions || [],
      maxTier: maxTier || null,
      minTier: minTier || null,
      memberPuuids,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
