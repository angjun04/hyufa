import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRankedInfo } from "@/lib/riot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      gameName,
      tagLine,
      preferredPositions,
      bio,
      peakTierS15,
      peakRankS15,
    } = body;

    if (!email || !password || !gameName || !tagLine) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    const existingRiot = await prisma.user.findUnique({
      where: { gameName_tagLine: { gameName, tagLine } },
    });
    if (existingRiot) {
      return NextResponse.json(
        { error: "이미 등록된 라이엇 계정입니다." },
        { status: 400 }
      );
    }

    // Riot API로 계정 확인 및 현재 티어 조회
    let riotData = null;
    try {
      riotData = await getRankedInfo(gameName, tagLine);
    } catch {
      // Riot API 실패 시에도 가입은 허용 (나중에 갱신 가능)
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        gameName,
        tagLine,
        puuid: riotData?.puuid || null,
        summonerId: riotData?.summonerId || null,
        currentTier: riotData?.tier || null,
        currentRank: riotData?.rank || null,
        currentLP: riotData?.lp || null,
        peakTierS15: peakTierS15 || null,
        peakRankS15: peakRankS15 || null,
        preferredPositions: preferredPositions || [],
        bio: bio || null,
      },
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
