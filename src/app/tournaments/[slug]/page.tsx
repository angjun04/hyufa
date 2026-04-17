"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TierBadge from "@/components/TierBadge";

interface MemberWithTier {
  id: string;
  gameName: string;
  tagLine: string;
  position: string | null;
  role: string | null;
  isCaptain: boolean;
  tier: {
    currentTier: string | null;
    currentRank: string | null;
    currentLP: number | null;
    peakTierS16: string | null;
    peakRankS16: string | null;
    peakTierS15: string | null;
    peakRankS15: string | null;
  } | null;
}
interface TeamWithMembers {
  id: string;
  name: string;
  tag: string | null;
  logoUrl: string | null;
  description: string | null;
  seed: number | null;
  members: MemberWithTier[];
}
interface MatchSummary {
  id: string;
  round: string;
  roundOrder: number;
  matchOrder: number;
  teamA: { id: string; name: string; tag: string | null } | null;
  teamB: { id: string; name: string; tag: string | null } | null;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  scheduledAt: string | null;
  vodUrl: string | null;
}
interface PublicTournament {
  id: string;
  slug: string;
  name: string;
  season: string | null;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  teams: TeamWithMembers[];
  matches: MatchSummary[];
}

const POSITION_ORDER = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
function positionWeight(p: string | null): number {
  if (!p) return 999;
  const i = POSITION_ORDER.indexOf(p);
  return i >= 0 ? i : 999;
}

export default function PublicTournamentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [t, setT] = useState<PublicTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"teams" | "bracket">("teams");

  useEffect(() => {
    fetch(`/api/tournaments/${slug}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setT)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  if (!t) return <div className="text-center py-20 text-gray-500">대회를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/tournaments" className="text-xs text-[#6c727f] hover:text-white">
          ← 대회 목록
        </Link>
        <h1 className="text-2xl font-bold text-white mt-1">{t.name}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          {t.season && <span>{t.season}</span>}
          {(t.startDate || t.endDate) && (
            <span>
              {t.startDate ? new Date(t.startDate).toLocaleDateString("ko-KR") : "-"}
              {t.endDate ? ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR")}` : ""}
            </span>
          )}
        </div>
        {t.description && <p className="text-sm text-gray-400 mt-2">{t.description}</p>}
      </div>

      <div className="flex gap-1 border-b border-[#232830]">
        <button
          onClick={() => setTab("teams")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "teams"
              ? "text-white border-b-2 border-[#e08a3c]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          팀 ({t.teams.length})
        </button>
        <button
          onClick={() => setTab("bracket")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "bracket"
              ? "text-white border-b-2 border-[#e08a3c]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          대진표 ({t.matches.length})
        </button>
      </div>

      {tab === "teams" ? <TeamsView teams={t.teams} /> : <BracketView t={t} />}
    </div>
  );
}

function TeamsView({ teams }: { teams: TeamWithMembers[] }) {
  if (teams.length === 0)
    return <div className="text-center py-10 text-gray-500 text-sm">등록된 팀이 없습니다.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className="bg-[#121519] border border-[#232830] rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold">{team.name}</h3>
                {team.tag && (
                  <span className="text-xs text-gray-400 bg-[#1a1e25] px-1.5 py-0.5 rounded">
                    {team.tag}
                  </span>
                )}
              </div>
              {team.description && (
                <p className="text-xs text-gray-500 mt-0.5">{team.description}</p>
              )}
            </div>
            {team.seed != null && (
              <span className="text-xs text-gray-500">시드 #{team.seed}</span>
            )}
          </div>
          <div className="space-y-1.5">
            {team.members.length === 0 ? (
              <div className="text-xs text-gray-500">팀원 없음</div>
            ) : (
              [...team.members]
                .sort((a, b) => {
                  if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1;
                  return positionWeight(a.position) - positionWeight(b.position);
                })
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 text-sm bg-[#0b0d11]/50 rounded px-2 py-1.5"
                  >
                    {m.position && (
                      <span className="text-xs text-gray-400 w-16">{m.position}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm">
                        {m.gameName}
                        <span className="text-gray-500 text-xs">#{m.tagLine}</span>
                      </span>
                      {m.isCaptain && (
                        <span className="ml-1.5 text-[10px] text-[#e6b73f]">★ 주장</span>
                      )}
                    </div>
                    {m.tier?.currentTier && (
                      <TierBadge
                        tier={m.tier.currentTier}
                        rank={m.tier.currentRank}
                        lp={m.tier.currentLP}
                        size="xs"
                      />
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BracketView({ t }: { t: PublicTournament }) {
  if (t.matches.length === 0)
    return <div className="text-center py-10 text-gray-500 text-sm">대진표가 없습니다.</div>;

  const grouped: Record<string, MatchSummary[]> = {};
  for (const m of t.matches) {
    const key = `${m.roundOrder}::${m.round}`;
    (grouped[key] ??= []).push(m);
  }
  const keys = Object.keys(grouped).sort((a, b) => {
    const [ao] = a.split("::");
    const [bo] = b.split("::");
    return parseInt(ao, 10) - parseInt(bo, 10);
  });

  return (
    <div className="space-y-6">
      {keys.map((k) => {
        const [, name] = k.split("::");
        return (
          <div key={k}>
            <h3 className="text-sm text-[#e08a3c] font-bold mb-2">{name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {grouped[k].map((m) => (
                <Link
                  key={m.id}
                  href={`/tournaments/${t.slug}/matches/${m.id}`}
                  className="block bg-[#121519] border border-[#232830] hover:border-[#e08a3c]/60 rounded p-3 transition"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>
                      Bo{m.bestOf}
                      {m.scheduledAt && (
                        <span className="ml-2">
                          {new Date(m.scheduledAt).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </span>
                    {m.vodUrl && <span className="text-[#e08a3c]">VOD</span>}
                  </div>
                  <div className="space-y-0.5">
                    <TeamLine
                      name={m.teamA?.name ?? "TBD"}
                      tag={m.teamA?.tag ?? null}
                      score={m.scoreA}
                      isWinner={!!m.winnerTeamId && m.winnerTeamId === m.teamAId}
                    />
                    <TeamLine
                      name={m.teamB?.name ?? "TBD"}
                      tag={m.teamB?.tag ?? null}
                      score={m.scoreB}
                      isWinner={!!m.winnerTeamId && m.winnerTeamId === m.teamBId}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamLine({
  name,
  tag,
  score,
  isWinner,
}: {
  name: string;
  tag: string | null;
  score: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1 rounded ${
        isWinner ? "bg-[#e08a3c]/10" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm truncate ${isWinner ? "text-white font-bold" : "text-gray-300"}`}>
          {name}
        </span>
        {tag && <span className="text-xs text-gray-500">[{tag}]</span>}
      </div>
      <span className={`text-sm font-mono ${isWinner ? "text-[#e6b73f] font-bold" : "text-gray-400"}`}>
        {score}
      </span>
    </div>
  );
}
