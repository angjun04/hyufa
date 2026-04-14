"use client";

import TierBadge from "./TierBadge";
import PositionBadge from "./PositionBadge";
import type { TeamPostData } from "@/lib/types";

interface TeamCardProps {
  post: TeamPostData;
  currentUserId?: string;
  onApply?: (postId: string, toUserId: string) => void;
}

export default function TeamCard({
  post,
  currentUserId,
  onApply,
}: TeamCardProps) {
  const timeAgo = getTimeAgo(new Date(post.createdAt));

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-yellow-500/50 transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-bold text-lg">{post.title}</h3>
        <span className="text-xs text-gray-500 shrink-0 ml-2">{timeAgo}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400 text-sm">
          {post.user.gameName}
          <span className="text-gray-500">#{post.user.tagLine}</span>
        </span>
        <TierBadge
          tier={post.user.currentTier}
          rank={post.user.currentRank}
          size="sm"
        />
      </div>

      <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">
        {post.description}
      </p>

      {post.positions.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-gray-500 mb-1 block">모집 포지션</span>
          <div className="flex flex-wrap gap-1.5">
            {post.positions.map((pos) => (
              <PositionBadge key={pos} position={pos} />
            ))}
          </div>
        </div>
      )}

      {(post.minTier || post.maxTier) && (
        <p className="text-xs text-gray-500 mb-3">
          티어 조건:{" "}
          <span className="text-gray-300">
            {post.minTier || "제한없음"} ~ {post.maxTier || "제한없음"}
          </span>
        </p>
      )}

      {onApply && currentUserId && currentUserId !== post.userId && (
        <button
          onClick={() => onApply(post.id, post.userId)}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-2 rounded-lg transition font-medium"
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
