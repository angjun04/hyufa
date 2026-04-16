// fow.lol 크롤러 — S15(2025) peak 티어 + 솔로랭크 판수 조회

import * as cheerio from "cheerio";

export interface FowPeakResult {
  tier: string | null;
  rank: string | null;
  lp: number | null;
}

export interface FowSummary {
  peak: FowPeakResult;
  gamesS15: number | null; // S15 솔로랭크 판수 (자유랭크 / 노말 제외)
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

// S15(2025) 시즌 범위 (KST 기준)
// 시작: 2025-01-08, 종료: 2025-12-31 (S16은 2026 시작)
const S15_START = new Date("2025-01-08T00:00:00+09:00");
const S15_END = new Date("2026-01-01T00:00:00+09:00");

// 안전장치: 최대 페이지 수 (한 페이지 ~30판이라 12 = 360판까지 커버)
const MAX_PAGES = 12;

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
  const m = html.match(/sid=(\d+)/);
  return m?.[1] ?? null;
}

/**
 * 페이지 HTML에서 game 날짜를 timestamp 형식으로 추출.
 * fow의 game_summary 안에는 tipsy='YYYY. MM. DD. ...' 형식의 날짜가 있다.
 */
function parseGameDates(html: string): Date[] {
  const dates: Date[] = [];
  const re = /tipsy='(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(d)) {
      dates.push(new Date(y, mo - 1, d));
    }
  }
  return dates;
}

/**
 * 솔로랭크 게임 목록을 페이지네이션해 S15 범위 판수 카운트.
 * fow는 한 페이지 ~30판, get_more_games의 data-ts로 다음 cursor 제공.
 */
async function countS15SoloGames(sid: string): Promise<number | null> {
  let ts: string | null = null;
  let s15Count = 0;
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const url = `https://www.fow.lol/api/games?type=solo&region=kr&sid=${sid}&champ=0${ts ? `&ts=${ts}` : ""}`;
    const html = await fetchHtml(url);
    if (!html) {
      // 한 번도 못 가져왔으면 null, 일부 가져왔으면 그 값 반환
      return pageCount === 0 ? null : s15Count;
    }
    pageCount++;

    const dates = parseGameDates(html);
    if (dates.length === 0) break;

    // S15 범위 카운트
    for (const d of dates) {
      if (d >= S15_START && d < S15_END) s15Count++;
    }

    // 가장 오래된 게임이 S15 이전이면 중단
    const oldest = dates[dates.length - 1];
    if (oldest < S15_START) break;

    // 다음 페이지 cursor
    const tsMatch = html.match(
      /get_more_games[^>]*data-ts=['"](\d+)['"]/
    );
    if (!tsMatch) break;
    const newTs = tsMatch[1];
    if (newTs === ts) break; // 동일 cursor면 무한 루프 방지
    ts = newTs;
  }

  return s15Count;
}

/**
 * S15 peak + 솔로랭크 판수 조회.
 * 메인 페이지 1회 + 게임 목록 페이지네이션 (보통 1~5회).
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
    gamesS15 = await countS15SoloGames(sid);
  }
  return { peak, gamesS15 };
}

/**
 * 호환용 — peak만.
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
