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

  return {
    puuid: account.puuid,
    summonerId: summoner?.id ?? "",
    tier: soloQueue?.tier || "UNRANKED",
    rank: soloQueue?.rank || "",
    lp: soloQueue?.leaguePoints || 0,
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
