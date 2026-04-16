import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRankedInfo } from "@/lib/riot";
import { fetchS15SummaryFromFow } from "@/lib/fow";

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const PHONE_RE = /^010\d{8}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      username,
      password,
      phoneNumber: rawPhone,
      gameName,
      tagLine,
      preferredPositions,
      bio,
    } = body;

    // ---- 입력 검증 ----
    if (!username || !password || !rawPhone || !gameName || !tagLine) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "아이디는 영문/숫자/_ 4~20자여야 합니다." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const phoneNumber = String(rawPhone).replace(/[-\s]/g, "");
    if (!PHONE_RE.test(phoneNumber)) {
      return NextResponse.json(
        { error: "올바른 휴대폰 번호 형식이 아닙니다 (예: 01012345678)." },
        { status: 400 }
      );
    }

    // ---- 중복 체크 ----
    const [usernameDup, phoneDup, riotDup] = await Promise.all([
      prisma.user.findUnique({ where: { username }, select: { id: true } }),
      prisma.user.findUnique({ where: { phoneNumber }, select: { id: true } }),
      prisma.user.findUnique({
        where: { gameName_tagLine: { gameName, tagLine } },
        select: { id: true },
      }),
    ]);
    if (usernameDup) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 400 });
    }
    if (phoneDup) {
      return NextResponse.json(
        { error: "이미 가입된 휴대폰 번호입니다." },
        { status: 400 }
      );
    }
    if (riotDup) {
      return NextResponse.json(
        { error: "이미 등록된 라이엇 계정입니다." },
        { status: 400 }
      );
    }

    // ---- 라이엇 계정 검증 + 현재 시즌 조회 ----
    let snap;
    try {
      snap = await getRankedInfo(gameName, tagLine);
    } catch (e) {
      console.error("Riot API error during registration:", e);
      return NextResponse.json(
        { error: "라이엇 서버 조회에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }
    if (!snap) {
      return NextResponse.json(
        { error: "라이엇 계정을 찾을 수 없습니다. 닉네임/태그를 확인해주세요." },
        { status: 400 }
      );
    }

    // PUUID 중복 (드물지만 가능 — 기존 캐시에만 있고 user는 없는 경우)
    const puuidDup = await prisma.user.findUnique({ where: { puuid: snap.puuid } });
    if (puuidDup) {
      return NextResponse.json(
        { error: "이 라이엇 계정은 이미 다른 사용자가 가입했습니다." },
        { status: 400 }
      );
    }

    // ---- S15 peak + 판수 (fow.lol) — 실패해도 가입 진행 ----
    const s15Summary = await fetchS15SummaryFromFow(gameName, tagLine).catch(
      () => ({
        peak: { tier: null, rank: null, lp: null },
        gamesS15: null,
      })
    );
    const s15Peak = s15Summary.peak;
    const gamesS15 = s15Summary.gamesS15;

    const hashedPassword = await hash(password, 12);

    // ---- 트랜잭션: User + TierCache 동시 생성 ----
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          phoneNumber,
          gameName,
          tagLine,
          puuid: snap.puuid,
          summonerId: snap.summonerId || null,
          peakTierS15: s15Peak.tier,
          peakRankS15: s15Peak.rank,
          peakSourceS15: s15Peak.tier ? "fow" : null,
          gamesS15: gamesS15,
          preferredPositions: Array.isArray(preferredPositions)
            ? preferredPositions
            : [],
          bio: bio || null,
        },
      });

      await tx.tierCache.upsert({
        where: { puuid: snap.puuid },
        create: {
          puuid: snap.puuid,
          gameName,
          tagLine,
          currentTier: snap.tier,
          currentRank: snap.rank || null,
          currentLP: snap.lp,
          gamesS16: snap.games,
          peakTierS16: snap.tier === "UNRANKED" ? null : snap.tier,
          peakRankS16: snap.tier === "UNRANKED" ? null : snap.rank || null,
          peakLPS16: snap.tier === "UNRANKED" ? null : snap.lp,
          peakTierS15: s15Peak.tier,
          peakRankS15: s15Peak.rank,
          peakLPS15: s15Peak.lp,
          gamesS15: gamesS15,
          s15FetchedAt: new Date(),
        },
        update: {
          gameName,
          tagLine,
          currentTier: snap.tier,
          currentRank: snap.rank || null,
          currentLP: snap.lp,
          gamesS16: snap.games,
          peakTierS15: s15Peak.tier,
          peakRankS15: s15Peak.rank,
          peakLPS15: s15Peak.lp,
          gamesS15: gamesS15,
          s15FetchedAt: new Date(),
        },
      });

      return created;
    });

    return NextResponse.json(
      { message: "회원가입 완료!", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
