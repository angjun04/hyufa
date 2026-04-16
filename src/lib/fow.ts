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
 * fow.lol 페이지에서 특정 시즌의 "최고 기록"(peak) 을 파싱한다.
 *
 * HTML 구조:
 *   <DIV class='... tipsy_live'
 *        tipsy='[ 솔로랭크 S15 ]<BR><BR>최종 기록: MASTER I - 255<BR>최고 기록: CHALLENGER I - 1255<BR><HR>'>
 *     S15: MASTER
 *   </DIV>
 *
 * fow에 색인되지 않은 소환사는 404로 null 반환.
 */
export async function fetchPeakFromFow(
  gameName: string,
  tagLine: string,
  seasonLabel = "S15"
): Promise<FowPeakResult> {
  const empty: FowPeakResult = { tier: null, rank: null, lp: null };
  // /find/kr/ 경로: 한글 소환사명도 정상 조회됨 (/find/ 경로는 한글 404)
  const url = `https://www.fow.lol/find/kr/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok) return empty;
    html = await res.text();
  } catch {
    return empty;
  }

  const $ = cheerio.load(html);
  const candidates = $("div.tipsy_live");
  for (const el of candidates.toArray()) {
    const tipsy = $(el).attr("tipsy") ?? "";
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

    return { tier, rank, lp: Number.isFinite(lp) ? lp : null };
  }

  return empty;
}
