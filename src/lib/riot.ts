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

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount | null> {
  const res = await fetch(
    `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getSummonerByPuuid(
  puuid: string
): Promise<SummonerData | null> {
  const res = await fetch(
    `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getLeagueEntries(
  summonerId: string
): Promise<LeagueEntry[]> {
  const res = await fetch(
    `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY } }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getRankedInfo(gameName: string, tagLine: string) {
  const account = await getAccountByRiotId(gameName, tagLine);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid);
  if (!summoner) return null;

  const entries = await getLeagueEntries(summoner.id);
  const soloQueue = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");

  return {
    puuid: account.puuid,
    summonerId: summoner.id,
    tier: soloQueue?.tier || "UNRANKED",
    rank: soloQueue?.rank || "",
    lp: soloQueue?.leaguePoints || 0,
  };
}
