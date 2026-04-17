"use client";

import TierBadge from "./TierBadge";
import PositionBadge from "./PositionBadge";
import type { TeamPostData } from "@/lib/types";

interface TeamCardProps {
  post: TeamPostData;
  currentUserId?: string;
  onApply?: (postId: string, toUserId: string) => void;
  onEdit?: (post: TeamPostData) => void;
  onDelete?: (postId: string) => void;
}

export default function TeamCard({
  post,
  currentUserId,
  onApply,
  onEdit,
  onDelete,
}: TeamCardProps) {
  const timeAgo = getTimeAgo(new Date(post.createdAt));
  const isOwner = !!currentUserId && currentUserId === post.userId;

  return (
    <div className="bg-[#14171d] border border-[#232830] rounded-md p-4 hover:border-[#3a414c] transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-white font-bold text-[15px] leading-tight">
          {post.title}
        </h3>
        <span className="text-[11px] text-[#6c727f] shrink-0">{timeAgo}</span>
      </div>

      <div className="flex items-center gap-2 mb-3 text-[12px] text-[#a3a8b3]">
        <span>
          {post.user.gameName}
          <span className="text-[#6c727f]">#{post.user.tagLine}</span>
        </span>
        <TierBadge tier={post.user.currentTier} rank={post.user.currentRank} size="xs" />
      </div>

      <p className="text-[13px] text-[#cdd1d8] mb-3 whitespace-pre-wrap leading-relaxed">
        {post.description}
      </p>

      {post.members.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-[#6c727f] mb-1.5">
            현재 팀원
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {post.members.map((m) => (
              <div
                key={m.puuid}
                className="bg-[#0b0d11] border border-[#232830] rounded px-2 py-1.5"
              >
                <p className="text-[12px] text-[#cdd1d8] truncate">
                  {m.gameName}
                  <span className="text-[#6c727f]">#{m.tagLine}</span>
                </p>
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-wider text-[#6c727f]">
                      S16 현재
                    </span>
                    <TierBadge
                      tier={m.currentTier}
                      rank={m.currentRank}
                      lp={m.currentLP}
                      size="xs"
                    />
                  </div>
                  {m.peakTierS16 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-wider text-[#6c727f]">
                        S16 최고
                      </span>
                      <TierBadge
                        tier={m.peakTierS16}
                        rank={m.peakRankS16}
                        size="xs"
                      />
                    </div>
                  )}
                  {m.peakTierS15 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-wider text-[#6c727f]">
                        S15 최고
                      </span>
                      <TierBadge
                        tier={m.peakTierS15}
                        rank={m.peakRankS15}
                        size="xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {post.positions.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#6c727f]">
            모집
          </span>
          <div className="flex flex-wrap gap-1">
            {post.positions.map((pos) => (
              <PositionBadge key={pos} position={pos} />
            ))}
          </div>
        </div>
      )}

      {(post.minTier || post.maxTier) && (
        <p className="text-[11px] text-[#6c727f] mb-3">
          티어:{" "}
          <span className="text-[#a3a8b3]">
            {post.minTier || "제한없음"} ~ {post.maxTier || "제한없음"}
          </span>
        </p>
      )}

      {isOwner && (onEdit || onDelete) && (
        <div className="flex gap-1.5">
          {onEdit && (
            <button
              onClick={() => onEdit(post)}
              className="flex-1 bg-[#1a1e25] hover:bg-[#232830] border border-[#232830] hover:border-[#e08a3c] text-white text-[12px] py-1.5 rounded font-medium transition"
            >
              수정
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="flex-1 bg-[#1a1e25] hover:bg-[#2a1a1a] border border-[#232830] hover:border-[#c14545] text-[#c14545] text-[12px] py-1.5 rounded font-medium transition"
            >
              삭제
            </button>
          )}
        </div>
      )}

      {!isOwner && onApply && currentUserId && (
        <button
          onClick={() => onApply(post.id, post.userId)}
          className="w-full bg-[#1a1e25] hover:bg-[#232830] border border-[#232830] hover:border-[#e08a3c] text-white text-[12px] py-1.5 rounded font-medium transition"
        >
          참가 신청
        </button>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
