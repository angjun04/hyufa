// fow.lol 크롤러 — S15(2025) peak 티어 조회
// 라이엇 공식 API는 종료된 시즌의 peak를 제공하지 않으므로 fow에서 가져온다.
// (S15 솔로 판수는 fow API 페이지네이션이 안 돼서 라이엇 match-v5 사용 — riot.ts)

import * as cheerio from "cheerio";

export interface FowPeakResult {
  tier: string | null;
  rank: string | null;
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

function fetchHtml(url: string): Promise<string | null> {
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);
}

function parsePeakFromHtml(
  html: string,
  seasonLabel: string
): FowPeakResult {
  const empty: FowPeakResult = { tier: null, rank: null, lp: null };
  const $ = cheerio.load(html);
  const candidates = $("div.tipsy_live");
  for (const el of candidates.toArray()) {
    const tipsy = $(el).attr("tipsy") ?? "";
    const re = new RegExp(`\\[\\s*솔로랭크\\s+${seasonLabel}\\s*[\\]\\-]`);
    if (!re.test(tipsy)) continue;

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

/**
 * S15 peak를 fow에서 가져옴. 색인 안 된 소환사면 모두 null.
 */
export async function fetchPeakFromFow(
  gameName: string,
  tagLine: string,
  seasonLabel = "S15"
): Promise<FowPeakResult> {
  const url = `https://www.fow.lol/find/kr/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
  const html = await fetchHtml(url);
  if (!html) return { tier: null, rank: null, lp: null };
  return parsePeakFromHtml(html, seasonLabel);
}
