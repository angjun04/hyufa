// S15(2025) peak 티어 크롤러
// 라이엇 공식 API는 종료된 시즌의 peak를 제공하지 않으므로 외부 소스에서 가져온다.
// 1순위: fow.lol (peak/최종 둘 다 제공하지만 일부 소환사 미색인)
// 2순위: op.gg (대부분 소환사 색인, 다만 "final rank"만 제공 — peak와 다를 수 있음)

import * as cheerio from "cheerio";

export interface FowPeakResult {
  tier: string | null; // "DIAMOND", "MASTER" 등 (대문자 영문)
  rank: string | null; // "I", "II", "III", "IV" 또는 null (마스터 이상)
  lp: number | null;
  source: "fow" | "opgg" | null;
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
 * fow.lol — "최고 기록" (peak) 파싱.
 *
 * HTML 예:
 *   <DIV class='... tipsy_live'
 *        tipsy='[ 솔로랭크 S15 ]<BR><BR>최종 기록: MASTER I - 255<BR>최고 기록: CHALLENGER I - 1255<BR><HR>'>
 *     S15: MASTER
 *   </DIV>
 */
async function fetchFromFow(
  gameName: string,
  tagLine: string,
  seasonLabel: string
): Promise<Omit<FowPeakResult, "source">> {
  const empty = { tier: null, rank: null, lp: null };
  const url = `https://www.fow.lol/find/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;

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
 * op.gg — S2025 (= S15) 시즌 최종 랭크 파싱.
 *
 * HTML 예:
 *   S2025 </strong></td><td>...medals_mini/gold.png...<span>gold 2</span></div>
 *
 * op.gg는 "최종" 랭크만 제공하며 peak를 별도로 노출하지 않는다. fow가 없을 때만 사용.
 */
async function fetchFromOpGG(
  gameName: string,
  tagLine: string,
  seasonOpggLabel: string // "S2025"
): Promise<Omit<FowPeakResult, "source">> {
  const empty = { tier: null, rank: null, lp: null };
  const url = `https://www.op.gg/summoners/kr/${encodeURIComponent(`${gameName}-${tagLine}`)}`;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    if (!res.ok) return empty;
    html = await res.text();
  } catch {
    return empty;
  }

  // Pattern: {seasonLabel}가 </strong>로 닫힌 직후 ~ 다음 </tr> 사이에
  // medals_mini/{tier}.png 와 <span>...{tier} {rank}</span> 가 있음.
  const seasonIdx = html.indexOf(seasonOpggLabel);
  if (seasonIdx < 0) return empty;

  const nextRow = html.indexOf("</tr>", seasonIdx);
  const section = html.substring(seasonIdx, nextRow > 0 ? nextRow : seasonIdx + 3000);

  // tier medal 이미지: medals_mini/gold.png → "GOLD"
  const medalMatch = section.match(/medals_mini\/([a-z]+)\.png/i);
  // span 텍스트: "gold 2" → rank "2" (아라비아) — op.gg는 1~4 아라비아 숫자 사용
  const spanMatch = section.match(
    /<span[^>]*>\s*([a-z]+)\s*([1-4])\s*<\/span>/i
  );

  if (!medalMatch) return empty;
  const tier = medalMatch[1].toUpperCase();
  if (!VALID_TIERS.has(tier)) return empty;

  // master+ 는 division 없음
  if (tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER") {
    return { tier, rank: null, lp: null };
  }

  const arabic = spanMatch?.[2] ?? null;
  const rankMap: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
  };
  const rank = arabic ? rankMap[arabic] : null;

  return { tier, rank, lp: null };
}

/**
 * S15 peak를 여러 소스에서 시도. 성공 시 source 표시.
 */
export async function fetchPeakFromFow(
  gameName: string,
  tagLine: string,
  seasonLabel = "S15"
): Promise<FowPeakResult> {
  // 1순위: fow (peak 기록 제공)
  const fow = await fetchFromFow(gameName, tagLine, seasonLabel).catch(() => ({
    tier: null,
    rank: null,
    lp: null,
  }));
  if (fow.tier) return { ...fow, source: "fow" };

  // 2순위: op.gg (final 기록만 — 우리는 S2025 라벨 사용)
  //   S15 → S2025, S14 → S2024 등. 현재는 S15만 지원.
  const opggLabel = seasonLabel === "S15" ? "S2025" : null;
  if (opggLabel) {
    const opgg = await fetchFromOpGG(gameName, tagLine, opggLabel).catch(() => ({
      tier: null,
      rank: null,
      lp: null,
    }));
    if (opgg.tier) return { ...opgg, source: "opgg" };
  }

  return { tier: null, rank: null, lp: null, source: null };
}
