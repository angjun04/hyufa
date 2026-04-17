"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { PickEntry } from "@/lib/tournament";

interface TeamMini {
  id: string;
  name: string;
  tag: string | null;
  members: Array<{
    id: string;
    gameName: string;
    tagLine: string;
    position: string | null;
  }>;
}
interface GameDetail {
  id: string;
  gameNumber: number;
  blueTeamId: string | null;
  redTeamId: string | null;
  winnerSide: "blue" | "red" | null;
  blueBans: string[];
  redBans: string[];
  bluePicks: PickEntry[] | null;
  redPicks: PickEntry[] | null;
  durationSec: number | null;
  note: string | null;
}
interface MatchPublic {
  id: string;
  round: string;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  scheduledAt: string | null;
  vodUrl: string | null;
  note: string | null;
  tournament: { id: string; slug: string; name: string };
  teamA: TeamMini | null;
  teamB: TeamMini | null;
  winnerTeam: { id: string; name: string } | null;
  games: GameDetail[];
}

function fmtDuration(sec: number | null): string {
  if (sec == null) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PublicMatchDetailPage() {
  const { slug, matchId } = useParams<{ slug: string; matchId: string }>();
  const [m, setM] = useState<MatchPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${slug}/matches/${matchId}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setM)
      .finally(() => setLoading(false));
  }, [slug, matchId]);

  if (loading) return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  if (!m) return <div className="text-center py-20 text-gray-500">매치를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/tournaments/${m.tournament.slug}`}
          className="text-xs text-[#6c727f] hover:text-white"
        >
          ← {m.tournament.name}
        </Link>
        <h1 className="text-2xl font-bold text-white mt-1">
          {m.round} · {m.teamA?.name ?? "TBD"} vs {m.teamB?.name ?? "TBD"}
        </h1>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          <span>Bo{m.bestOf}</span>
          <span>
            {m.scoreA} - {m.scoreB}
          </span>
          {m.scheduledAt && (
            <span>{new Date(m.scheduledAt).toLocaleString("ko-KR")}</span>
          )}
          {m.vodUrl && (
            <a
              href={m.vodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e08a3c] hover:underline"
            >
              VOD 보기
            </a>
          )}
        </div>
        {m.winnerTeam && (
          <p className="text-sm text-[#e6b73f] mt-2">승자: {m.winnerTeam.name}</p>
        )}
      </div>

      {m.games.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">세트 기록이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {m.games.map((g) => (
            <GameView key={g.id} g={g} teamA={m.teamA} teamB={m.teamB} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameView({
  g,
  teamA,
  teamB,
}: {
  g: GameDetail;
  teamA: TeamMini | null;
  teamB: TeamMini | null;
}) {
  const teams = [teamA, teamB].filter((x): x is TeamMini => !!x);
  const blueTeam = teams.find((t) => t.id === g.blueTeamId) ?? null;
  const redTeam = teams.find((t) => t.id === g.redTeamId) ?? null;

  return (
    <div className="bg-[#121519] border border-[#232830] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">
          세트 {g.gameNumber}
          {g.durationSec != null && (
            <span className="text-xs text-gray-500 ml-2">{fmtDuration(g.durationSec)}</span>
          )}
        </h3>
        {g.winnerSide && (
          <span
            className={`text-xs font-bold ${
              g.winnerSide === "blue" ? "text-blue-400" : "text-red-400"
            }`}
          >
            {g.winnerSide === "blue" ? "블루 승" : "레드 승"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SideView
          side="blue"
          team={blueTeam}
          bans={g.blueBans}
          picks={g.bluePicks}
          isWinner={g.winnerSide === "blue"}
        />
        <SideView
          side="red"
          team={redTeam}
          bans={g.redBans}
          picks={g.redPicks}
          isWinner={g.winnerSide === "red"}
        />
      </div>

      {g.note && <p className="text-xs text-gray-500 mt-3">{g.note}</p>}
    </div>
  );
}

function SideView({
  side,
  team,
  bans,
  picks,
  isWinner,
}: {
  side: "blue" | "red";
  team: TeamMini | null;
  bans: string[];
  picks: PickEntry[] | null;
  isWinner: boolean;
}) {
  const color = side === "blue" ? "text-blue-400" : "text-red-400";
  const bg = side === "blue" ? "bg-blue-500/5" : "bg-red-500/5";
  const border = side === "blue" ? "border-blue-500/20" : "border-red-500/20";

  return (
    <div className={`${bg} border ${border} rounded p-3 ${isWinner ? "ring-1 ring-[#e6b73f]/40" : ""}`}>
      <div className={`text-xs font-bold ${color} mb-2`}>
        {side === "blue" ? "블루" : "레드"}
        {team && <span className="text-white ml-1">· {team.name}</span>}
      </div>
      {bans.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] text-gray-500 mb-1">밴</div>
          <div className="flex flex-wrap gap-1">
            {bans.map((b, i) => (
              <span
                key={i}
                className="text-xs bg-[#0b0d11] border border-gray-700 text-gray-400 line-through px-1.5 py-0.5 rounded"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
      {picks && picks.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 mb-1">픽</div>
          <div className="space-y-1">
            {picks.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs bg-[#0b0d11]/60 rounded px-2 py-1"
              >
                <span className="text-gray-500 w-14 shrink-0">{p.position}</span>
                <span className="text-white font-semibold">{p.champion}</span>
                {p.displayName && (
                  <span className="text-gray-500 truncate">· {p.displayName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
