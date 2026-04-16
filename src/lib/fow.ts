// fow.lol 크롤러 — S15(2025) peak 티어 + 전체 판수 조회
// 라이엇 공식 API는 종료된 시즌의 peak/판수를 제공하지 않으므로 fow에서 가져온다.

import * as cheerio from "cheerio";

export interface FowPeakResult {
  tier: string | null; // "DIAMOND", "MASTER" 등 (대문자 영문)
  rank: string | null; // "I", "II", "III", "IV" 또는 null (마스터 이상)
  lp: number | null;
}

export interface FowSummary {
  peak: FowPeakResult;
  gamesS15: number | null; // fow "챔피언(S15) 전체 사용 챔피언" 합산
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

function extractSid(html: string): string | null {
  // /api/champstat?sid=12345&region=... 패턴에서 추출
  const m = html.match(/sid=(\d+)/);
  return m?.[1] ?? null;
}

/**
 * 전체 사용 챔피언 목록(tab=15A)에서 판수 합산.
 * fow의 메인 페이지에는 판수 상위 7개만 있으므로 ajax 엔드포인트 호출 필요.
 */
async function sumChampGames(sid: string, tab: string): Promise<number | null> {
  const url = `https://www.fow.lol/api/champstat?sid=${sid}&region=kr&tab=${tab}`;
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(`<table>${html}</table>`);
  let total = 0;
  let any = false;
  $("tr.champ_stat").each((_, el) => {
    const tds = $(el).find("td");
    const games = parseInt(tds.eq(1).text().trim(), 10);
    if (Number.isFinite(games)) {
      total += games;
      any = true;
    }
  });
  return any ? total : 0;
}

/**
 * S15 peak + 전체 판수를 한 번에 반환 (메인 페이지 1회 + ajax 1회).
 */
export async function fetchS15SummaryFromFow(
  gameName: string,
  tagLine: string
): Promise<FowSummary> {
  const url = `https://www.fow.lol/find/kr/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
  const html = await fetchHtml(url);
  if (!html) {
    return {
      peak: { tier: null, rank: null, lp: null },
      gamesS15: null,
    };
  }

  const peak = parsePeakFromHtml(html, "S15");
  const sid = extractSid(html);
  let gamesS15: number | null = null;
  if (sid) {
    gamesS15 = await sumChampGames(sid, "15A");
  }
  return { peak, gamesS15 };
}

/**
 * 기존 호출부 호환용 — peak만 반환.
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
