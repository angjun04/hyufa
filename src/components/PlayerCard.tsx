"use client";

import TierBadge from "./TierBadge";
import PositionBadge from "./PositionBadge";
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
  const isMe = currentUserId === player.id;

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
