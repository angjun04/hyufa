"use client";

import { useState } from "react";
import {
  TIERS,
  DIVISIONS,
  TIER_LABELS,
  TEAM_POINT_CAP,
  getTierScore,
  formatTier,
  POSITIONS,
} from "@/lib/tierScore";

interface PlayerSlot {
  position: string;
  tier: string;
  rank: string;
}

const emptySlot = (): PlayerSlot => ({
  position: "",
  tier: "",
  rank: "",
});

export default function ScoreCalculator() {
  const [players, setPlayers] = useState<PlayerSlot[]>([
    { position: "TOP", tier: "", rank: "" },
    { position: "JUNGLE", tier: "", rank: "" },
    { position: "MID", tier: "", rank: "" },
    { position: "ADC", tier: "", rank: "" },
    { position: "SUPPORT", tier: "", rank: "" },
  ]);

  const updatePlayer = (
    index: number,
    field: keyof PlayerSlot,
    value: string
  ) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    // 마스터 이상은 디비전 자동 I 설정
    if (
      field === "tier" &&
      (value === "MASTER" || value === "GRANDMASTER" || value === "CHALLENGER")
    ) {
      updated[index].rank = "I";
    }
    setPlayers(updated);
  };

  const totalScore = players.reduce(
    (sum, p) => sum + getTierScore(p.tier, p.rank),
    0
  );
  const remaining = TEAM_POINT_CAP - totalScore;
  const isOverCap = remaining < 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">팀 포인트 계산기</h2>
        <div
          className={`text-right ${isOverCap ? "text-red-400" : "text-green-400"}`}
        >
          <p className="text-2xl font-bold">
            {totalScore} / {TEAM_POINT_CAP}
          </p>
          <p className="text-sm">
            {isOverCap ? `${Math.abs(remaining)}점 초과` : `${remaining}점 여유`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOverCap
              ? "bg-red-500"
              : totalScore > TEAM_POINT_CAP * 0.8
                ? "bg-yellow-500"
                : "bg-blue-500"
          }`}
          style={{
            width: `${Math.min((totalScore / TEAM_POINT_CAP) * 100, 100)}%`,
          }}
        />
      </div>

      <div className="space-y-3">
        {players.map((player, i) => {
          const score = getTierScore(player.tier, player.rank);
          const posInfo = POSITIONS.find((p) => p.value === player.position);
          const isHighTier =
            player.tier === "MASTER" ||
            player.tier === "GRANDMASTER" ||
            player.tier === "CHALLENGER";

          return (
            <div
              key={i}
              className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3"
            >
              {/* Position */}
              <div className="w-16 text-center">
                <span className="text-lg">{posInfo?.icon || "?"}</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {posInfo?.label || "포지션"}
                </p>
              </div>

              {/* Tier select */}
              <select
                value={player.tier}
                onChange={(e) => updatePlayer(i, "tier", e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">티어 선택</option>
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {TIER_LABELS[tier]}
                  </option>
                ))}
              </select>

              {/* Division select */}
              {player.tier && !isHighTier && (
                <select
                  value={player.rank}
                  onChange={(e) => updatePlayer(i, "rank", e.target.value)}
                  className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">단계</option>
                  {DIVISIONS.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              )}

              {/* Score */}
              <div className="w-16 text-right">
                <span className="text-yellow-400 font-bold">{score}</span>
                <span className="text-gray-500 text-xs">점</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setPlayers(Array.from({ length: 5 }, emptySlot))}
        className="mt-4 text-sm text-gray-400 hover:text-white transition"
      >
        초기화
      </button>
    </div>
  );
}
