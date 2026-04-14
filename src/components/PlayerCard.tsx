"use client";

import TierBadge from "./TierBadge";
import PositionBadge from "./PositionBadge";
import { formatTier, getTierScore } from "@/lib/tierScore";
import type { UserProfile } from "@/lib/types";

interface PlayerCardProps {
  player: UserProfile;
  currentUserId?: string;
  onContact?: (playerId: string) => void;
}

export default function PlayerCard({
  player,
  currentUserId,
  onContact,
}: PlayerCardProps) {
  const peakS15 = formatTier(player.peakTierS15, player.peakRankS15);
  const peakS16 = formatTier(player.peakTierS16, player.peakRankS16);
  const score = getTierScore(
    player.currentTier || "UNRANKED",
    player.currentRank || ""
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-bold text-lg">
            {player.gameName}
            <span className="text-gray-400 font-normal text-sm">
              #{player.tagLine}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            팀 포인트: <span className="text-yellow-400 font-semibold">{score}점</span>
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 w-24 shrink-0">S16 현재</span>
          <TierBadge
            tier={player.currentTier}
            rank={player.currentRank}
            lp={player.currentLP}
            size="sm"
          />
        </div>
        {player.peakTierS15 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 w-24 shrink-0">S15 최고</span>
            <span className="text-gray-200">{peakS15}</span>
          </div>
        )}
        {player.peakTierS16 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 w-24 shrink-0">S16 최고</span>
            <span className="text-gray-200">{peakS16}</span>
          </div>
        )}
      </div>

      {player.preferredPositions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {player.preferredPositions.map((pos) => (
            <PositionBadge key={pos} position={pos} />
          ))}
        </div>
      )}

      {player.bio && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{player.bio}</p>
      )}

      {onContact && currentUserId && currentUserId !== player.id && (
        <button
          onClick={() => onContact(player.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition font-medium"
        >
          컨택 신청
        </button>
      )}
    </div>
  );
}
