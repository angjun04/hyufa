// fow.lol 크롤러 — S15(2025) peak 티어 조회
// 라이엇 공식 API는 종료된 시즌의 peak를 제공하지 않으므로 fow.lol에서 가져온다.

import * as cheerio from "cheerio";

export interface FowPeakResult {
  tier: string | null; // "DIAMOND", "MASTER" 등 (대문자 영문)
  rank: string | null; // "I", "II", "III", "IV" 또는 null (마스터 이상)
  lp: number | null;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const VALID_TIERS = new Set([
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
]);

const VALID_RANKS = new Set(["I", "II", "III", "IV"]);

/**
 * fow.lol 페이지에서 특정 시즌의 peak 티어를 파싱한다.
 *
 * 페이지 구조:
 * <DIV class='fbtn small11 highlight tipsy_live'
 *      tipsy='[ 솔로랭크 S15 ]<BR><BR>최종 기록: MASTER I - 255<BR>최고 기록: CHALLENGER I - 1255<BR><HR>'>
 *   S15: MASTER
 * </DIV>
 *
 * 우리는 tipsy 속성 안의 "최고 기록" 라인을 본다.
 */
export async function fetchPeakFromFow(
  gameName: string,
  tagLine: string,
  seasonLabel = "S15"
): Promise<FowPeakResult> {
  const empty: FowPeakResult = { tier: null, rank: null, lp: null };
  const url = `https://www.fow.lol/find/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      // Next.js 캐시 비활성 (서버에서 직접 호출하므로)
      cache: "no-store",
    });
    if (!res.ok) return empty;
    html = await res.text();
  } catch {
    return empty;
  }

  const $ = cheerio.load(html);

  // tipsy_live 클래스를 가진 div를 모두 순회
  const candidates = $("div.tipsy_live");
  for (const el of candidates.toArray()) {
    const tipsy = $(el).attr("tipsy") ?? "";
    // "[ 솔로랭크 S15 ]" 와 같이 정확히 시즌 라벨을 포함해야 함
    // S15가 S15-1, S150 같이 잘못 매칭되는 걸 막기 위해 경계를 본다.
    const re = new RegExp(`\\[\\s*솔로랭크\\s+${seasonLabel}\\s*[\\]\\-]`);
    if (!re.test(tipsy)) continue;

    // "최고 기록: TIER RANK - LP" 또는 "최고 기록: TIER - LP" (마스터+)
    const peakMatch = tipsy.match(
      /최고\s*기록:\s*([A-Z]+)(?:\s+(I{1,3}|IV))?\s*-\s*(\d+)/
    );
    if (!peakMatch) continue;

    const tier = peakMatch[1];
    const rank = peakMatch[2] ?? null;
    const lp = parseInt(peakMatch[3], 10);
    if (!VALID_TIERS.has(tier)) continue;
    if (rank && !VALID_RANKS.has(rank)) continue;

    return {
      tier,
      rank: rank,
      lp: Number.isFinite(lp) ? lp : null,
    };
  }

  return empty;
}
