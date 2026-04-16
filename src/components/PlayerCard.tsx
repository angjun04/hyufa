"use client";

import TierBadge from "./TierBadge";
import PositionBadge from "./PositionBadge";
import {
  POSITIONS,
  TIER_LABELS,
  getTierScore,
  gamesPenalty,
} from "@/lib/tierScore";
import type { UserProfile } from "@/lib/types";

interface PlayerCardProps {
  player: UserProfile;
  currentUserId?: string;
  onContact?: (playerId: string) => void;
}

interface ScoredSeason {
  season: "S15" | "S16";
  base: number;
  penalty: number;
  total: number;
  tier: string | null;
  rank: string | null;
  games: number | null;
}

/**
 * 한 포지션에 대해 S15/S16 중 더 유리한 점수 계산.
 * 점수계산기와 동일 로직: 티어 base 더 높은 쪽, 동률이면 판수 많은 쪽.
 * S15/S16 정보가 모두 없거나 0이면 null.
 */
function bestScoreForPosition(
  player: UserProfile,
  position: string
): ScoredSeason | null {
  const seasons: ScoredSeason[] = [];

  if (player.peakTierS16) {
    const base = getTierScore(
      player.peakTierS16,
      player.peakRankS16 ?? "",
      position
    );
    if (base > 0) {
      const penalty = gamesPenalty(player.gamesS16);
      seasons.push({
        season: "S16",
        base,
        penalty,
        total: base + penalty,
        tier: player.peakTierS16,
        rank: player.peakRankS16,
        games: player.gamesS16 ?? null,
      });
    }
  } else if (player.currentTier && player.currentTier !== "UNRANKED") {
    // S16 peak 없으면 currentTier로 fallback
    const base = getTierScore(
      player.currentTier,
      player.currentRank ?? "",
      position
    );
    if (base > 0) {
      const penalty = gamesPenalty(player.gamesS16);
      seasons.push({
        season: "S16",
        base,
        penalty,
        total: base + penalty,
        tier: player.currentTier,
        rank: player.currentRank,
        games: player.gamesS16 ?? null,
      });
    }
  }

  if (player.peakTierS15) {
    const base = getTierScore(
      player.peakTierS15,
      player.peakRankS15 ?? "",
      position
    );
    if (base > 0) {
      const penalty = gamesPenalty(player.gamesS15);
      seasons.push({
        season: "S15",
        base,
        penalty,
        total: base + penalty,
        tier: player.peakTierS15,
        rank: player.peakRankS15,
        games: player.gamesS15 ?? null,
      });
    }
  }

  if (seasons.length === 0) return null;
  // 티어 base 높은 쪽 우선, 동률이면 판수 많은(패널티 적은) 쪽
  seasons.sort((a, b) => {
    if (b.base !== a.base) return b.base - a.base;
    return (b.games ?? -1) - (a.games ?? -1);
  });
  return seasons[0];
}

export default function PlayerCard({
  player,
  currentUserId,
  onContact,
}: PlayerCardProps) {
  const isMe = currentUserId === player.id;

  // 선호 포지션이 있으면 그 포지션들만, 없으면 5포지션 전부
  const positionsToScore =
    player.preferredPositions.length > 0
      ? player.preferredPositions
      : POSITIONS.map((p) => p.value);

  const positionScores = positionsToScore.map((pos) => ({
    position: pos,
    posInfo: POSITIONS.find((p) => p.value === pos)!,
    score: bestScoreForPosition(player, pos),
  }));

  return (
    <div className="bg-[#14171d] border border-[#232830] rounded-md p-3.5 hover:border-[#3a414c] transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-white font-bold text-[14px] leading-tight truncate">
            {player.gameName}
            <span className="text-[#6c727f] font-normal text-xs ml-0.5">
              #{player.tagLine}
            </span>
          </p>
          {player.preferredPositions.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {player.preferredPositions.map((p) => (
                <PositionBadge key={p} position={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tier rows */}
      <div className="space-y-1 mb-3 mt-3 pt-3 border-t border-[#1a1e25]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#6c727f]">S16 현재</span>
          <TierBadge
            tier={player.currentTier}
            rank={player.currentRank}
            lp={player.currentLP}
          />
        </div>
        {player.peakTierS16 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6c727f]">S16 최고</span>
            <TierBadge tier={player.peakTierS16} rank={player.peakRankS16} />
          </div>
        )}
        {player.peakTierS15 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6c727f]">S15 최고</span>
            <TierBadge tier={player.peakTierS15} rank={player.peakRankS15} />
          </div>
        )}
      </div>

      {/* 포지션별 LCMC 점수 */}
      {positionScores.some((p) => p.score) && (
        <div className="mb-3 pt-3 border-t border-[#1a1e25]">
          <p className="text-[10px] uppercase tracking-wider text-[#6c727f] mb-1.5">
            LCMC 점수
            {player.preferredPositions.length === 0 && (
              <span className="text-[#6c727f] normal-case lowercase ml-1">
                · 5포지션
              </span>
            )}
          </p>
          <div className="grid grid-cols-5 gap-1">
            {positionScores.map(({ position, posInfo, score }) => (
              <div
                key={position}
                className="bg-[#0b0d11] border border-[#232830] rounded px-1 py-1.5 text-center"
                title={
                  score
                    ? `${score.season} · ${TIER_LABELS[score.tier ?? ""] ?? score.tier ?? ""}${score.rank ? ` ${score.rank}` : ""}${score.games != null ? ` · ${score.games}판` : ""}${score.penalty > 0 ? ` · 판수 +${score.penalty}` : ""}`
                    : "정보 없음"
                }
              >
                <div className="text-[10px] text-[#6c727f] leading-none mb-1">
                  {posInfo.icon}
                </div>
                <div className="text-[12px] font-bold text-[#e6b73f] tabular-nums leading-none">
                  {score?.total ?? "-"}
                </div>
                {score && score.penalty > 0 && (
                  <div className="text-[9px] text-[#e3603f] tabular-nums leading-none mt-0.5">
                    +{score.penalty}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {player.bio && (
        <p className="text-[12px] text-[#a3a8b3] mb-3 line-clamp-2">{player.bio}</p>
      )}

      {onContact && currentUserId && !isMe && (
        <button
          onClick={() => onContact(player.id)}
          className="w-full bg-[#1a1e25] hover:bg-[#232830] border border-[#232830] hover:border-[#e08a3c] text-white text-[12px] py-1.5 rounded font-medium transition"
        >
          컨택 신청
        </button>
      )}
      {isMe && (
        <p className="text-center text-[11px] text-[#6c727f] py-1">내 프로필</p>
      )}
    </div>
  );
}
