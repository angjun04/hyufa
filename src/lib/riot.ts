// 라이엇 게임즈 API 클라이언트
// 키 발급: https://developer.riotgames.com/

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface SummonerData {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RankSnapshot {
  puuid: string;
  summonerId: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  games: number; // wins + losses
}

export class RiotApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

async function riotFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
    cache: "no-store",
  });
}

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount | null> {
  const res = await riotFetch(
    `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new RiotApiError(res.status, `account lookup failed`);
  return res.json();
}

export async function getSummonerByPuuid(
  puuid: string
): Promise<SummonerData | null> {
  const res = await riotFetch(
    `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );
  if (res.status === 404) return null;
  if (!res.ok) return null; // 일부 키는 이 엔드포인트 권한 없음 — 전체 가입 차단 막기
  return res.json();
}

/**
 * PUUID 기반 신 엔드포인트 (2024년 이후 by-summoner는 deprecated).
 */
export async function getLeagueEntriesByPuuid(
  puuid: string
): Promise<LeagueEntry[]> {
  const res = await riotFetch(
    `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`
  );
  if (!res.ok) return [];
  return res.json();
}

/**
 * 라이엇 ID로 계정 존재 + 현재 솔로랭크 정보를 한 번에 조회.
 * 계정 없으면 null. 계정은 있는데 언랭이면 tier="UNRANKED".
 *
 * summoner v4 호출은 summonerId를 얻기 위함이지만 신 league 엔드포인트는 PUUID로
 * 직접 조회 가능하므로 summoner 호출 실패해도 ranked 조회는 진행한다.
 */
export async function getRankedInfo(
  gameName: string,
  tagLine: string
): Promise<RankSnapshot | null> {
  const account = await getAccountByRiotId(gameName, tagLine);
  if (!account) return null;

  // summoner는 부가 정보 (실패해도 진행)
  const summoner = await getSummonerByPuuid(account.puuid).catch(() => null);

  const entries = await getLeagueEntriesByPuuid(account.puuid);
  const soloQueue = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");

  const wins = soloQueue?.wins ?? 0;
  const losses = soloQueue?.losses ?? 0;
  return {
    puuid: account.puuid,
    summonerId: summoner?.id ?? "",
    tier: soloQueue?.tier || "UNRANKED",
    rank: soloQueue?.rank || "",
    lp: soloQueue?.leaguePoints || 0,
    wins,
    losses,
    games: wins + losses,
  };
}

/**
 * 가입 시 사용 — 계정 존재만 확인 (puuid 반환).
 */
export async function verifyAccount(
  gameName: string,
  tagLine: string
): Promise<RiotAccount | null> {
  return getAccountByRiotId(gameName, tagLine);
}

// S15 (2025) 시즌 epoch 범위 (KST)
// 라이엇 공식 시작: 2025-01-08, 종료: 2025-12-31 (S16은 2026-01부터)
const S15_START_SEC = Math.floor(
  new Date("2025-01-08T00:00:00+09:00").getTime() / 1000
);
const S15_END_SEC = Math.floor(
  new Date("2026-01-01T00:00:00+09:00").getTime() / 1000
);

/**
 * 한 매치의 detail을 가져와 다시하기인지 판정.
 * 다시하기 기준: gameDuration < 300초 OR 본인 참가자가 gameEndedInEarlySurrender=true
 * (LoL 다시하기는 게임 시작 3분 경과 후 90초 이상 탈주자가 있을 때 가능)
 */
async function isRealGame(
  matchId: string,
  puuid: string
): Promise<boolean | null> {
  const res = await riotFetch(
    `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`
  );
  if (!res.ok) return null;
  type MatchDetail = {
    info?: {
      gameDuration?: number;
      participants?: { puuid: string; gameEndedInEarlySurrender?: boolean }[];
    };
  };
  const m = (await res.json()) as MatchDetail;
  const dur = m.info?.gameDuration ?? 0;
  const me = m.info?.participants?.find((p) => p.puuid === puuid);
  const earlySurr = me?.gameEndedInEarlySurrender ?? false;
  return dur >= 300 && !earlySurr;
}

async function fetchDetailsConcurrent(
  ids: string[],
  puuid: string,
  concurrency = 10
): Promise<number> {
  // valid 게임 수만 카운트. detail fetch 실패는 conservative하게 valid로 간주.
  let valid = 0;
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((id) => isRealGame(id, puuid))
    );
    for (const r of results) {
      if (r === null) valid++; // detail 실패 → valid 가정
      else if (r) valid++;
    }
  }
  return valid;
}

/**
 * S15 솔로랭크(queue=420) 판수 — 다시하기 제외.
 *
 * 비용 최소화 전략:
 *   1) match-v5 ids로 모든 솔로 매치 ID 수집 (페이지네이션, 1~6 호출)
 *   2) ids 개수가 패널티 경계(20/40)에서 멀면 detail 호출 SKIP — ids 그대로 반환
 *      - ids ≤ 17 → 패널티 +4 확정 (다시하기 빼면 더 적음)
 *      - ids ≥ 50 → 패널티 0 거의 확정 (다시하기 9개 이하 가정)
 *   3) ids가 경계 근처(18~22, 38~50)이면 detail 호출로 다시하기 정확히 필터
 *
 * 결과: 대부분 유저 1~6회만 호출. 경계 유저만 +5~30회.
 */
export async function countS15SoloGames(puuid: string): Promise<number | null> {
  // 1. 매치 ID 수집
  const allIds: string[] = [];
  let start = 0;
  const PAGE = 100;
  const MAX_PAGES = 6;
  for (let i = 0; i < MAX_PAGES; i++) {
    const url =
      `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids` +
      `?queue=420&startTime=${S15_START_SEC}&endTime=${S15_END_SEC}` +
      `&start=${start}&count=${PAGE}`;
    const res = await riotFetch(url);
    if (!res.ok) {
      if (i === 0) return null;
      break;
    }
    const ids: string[] = await res.json();
    allIds.push(...ids);
    if (ids.length < PAGE) break;
    start += PAGE;
  }

  const totalIds = allIds.length;
  if (totalIds === 0) return 0;

  // 2. ids ≤ 20 또는 > 50 이면 detail skip
  //    - ≤ 20: 다시하기 빼면 더 적어져도 어차피 ≤20 → 패널티 +4 동일
  //    - > 50: 다시하기 9개 이하면 41+ → 패널티 0 거의 확정 (트레이드오프)
  if (totalIds <= 20 || totalIds > 50) return totalIds;

  // 3. ids 21~50: detail로 다시하기 필터
  return fetchDetailsConcurrent(allIds, puuid);
}
