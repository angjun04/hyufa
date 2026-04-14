"use client";

import { useState } from "react";
import {
  CALC_TIERS,
  DIVISIONS,
  TIER_LABELS,
  TEAM_POINT_CAP,
  getTierScore,
  POSITIONS,
} from "@/lib/tierScore";

interface PlayerSlot {
  position: string;
  tier: string;
  rank: string;
}

export default function ScoreCalculator() {
  const [players, setPlayers] = useState<PlayerSlot[]>(
    POSITIONS.map((p) => ({ position: p.value, tier: "", rank: "" }))
  );

  const updatePlayer = (
    index: number,
    field: keyof PlayerSlot,
    value: string
  ) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "tier") {
      updated[index].rank = "";
    }
    setPlayers(updated);
  };

  const scores = players.map((p) =>
    p.tier && p.rank ? getTierScore(p.tier, p.rank, p.position) : 0
  );
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const remaining = TEAM_POINT_CAP - totalScore;
  const isOverCap = remaining < 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">LCMC 팀 포인트 계산기</h2>
        <div
          className={`text-right ${isOverCap ? "text-red-400" : "text-green-400"}`}
        >
          <p className="text-2xl font-bold">
            {totalScore} / {TEAM_POINT_CAP}
          </p>
          <p className="text-sm">
            {isOverCap
              ? `${Math.abs(remaining)}점 초과!`
              : `${remaining}점 여유`}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        포지션별 점수가 다릅니다. 실버4 이하 ~ 다이아1 이상 범위.
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOverCap
              ? "bg-red-500"
              : totalScore > TEAM_POINT_CAP * 0.85
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
          const posInfo = POSITIONS.find((p) => p.value === player.position);

          return (
            <div
              key={i}
              className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3"
            >
              {/* Position label */}
              <div className="w-16 text-center shrink-0">
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
                <option value="SILVER_BELOW">실버 4 이하</option>
                {CALC_TIERS.map((tier) =>
                  tier === "DIAMOND" ? (
                    // 다이아는 4~2까지만, 1은 "다이아1 이상"으로
                    <>
                      <option key={`${tier}_normal`} value={tier}>
                        {TIER_LABELS[tier]}
                      </option>
                      <option key="DIAMOND_ABOVE" value="DIAMOND_ABOVE">
                        다이아 1 이상
                      </option>
                    </>
                  ) : (
                    <option key={tier} value={tier}>
                      {TIER_LABELS[tier]}
                    </option>
                  )
                )}
              </select>

              {/* Division select */}
              {player.tier &&
                player.tier !== "SILVER_BELOW" &&
                player.tier !== "DIAMOND_ABOVE" && (
                  <select
                    value={player.rank}
                    onChange={(e) => updatePlayer(i, "rank", e.target.value)}
                    className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">단계</option>
                    {(player.tier === "DIAMOND"
                      ? (["IV", "III", "II"] as const)
                      : DIVISIONS
                    ).map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                )}

              {/* Score */}
              <div className="w-16 text-right shrink-0">
                <span className="text-yellow-400 font-bold">{scores[i]}</span>
                <span className="text-gray-500 text-xs">점</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() =>
          setPlayers(
            POSITIONS.map((p) => ({ position: p.value, tier: "", rank: "" }))
          )
        }
        className="mt-4 text-sm text-gray-400 hover:text-white transition"
      >
        초기화
      </button>
    </div>
  );
}
