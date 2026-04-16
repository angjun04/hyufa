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

type InputMode = "tier" | "nickname";

interface PlayerSlot {
  position: string;
  mode: InputMode;
  // 티어 모드
  tier: string;
  rank: string;
  // 닉네임 모드
  gameName: string;
  tagLine: string;
  resolvedTier: string | null;
  resolvedRank: string | null;
  resolvedLabel: string | null; // "Diamond II (확정)" 같은 표시용
  lookupError: string | null;
  lookupLoading: boolean;
}

const emptySlot = (position: string): PlayerSlot => ({
  position,
  mode: "tier",
  tier: "",
  rank: "",
  gameName: "",
  tagLine: "",
  resolvedTier: null,
  resolvedRank: null,
  resolvedLabel: null,
  lookupError: null,
  lookupLoading: false,
});

function scoreOf(p: PlayerSlot): number {
  if (p.mode === "nickname") {
    if (!p.resolvedTier) return 0;
    return getTierScore(p.resolvedTier, p.resolvedRank ?? "", p.position);
  }
  if (!p.tier) return 0;
  if (p.tier === "SILVER_BELOW" || p.tier === "DIAMOND_ABOVE")
    return getTierScore(p.tier, "", p.position);
  if (!p.rank) return 0;
  return getTierScore(p.tier, p.rank, p.position);
}

export default function ScoreCalculator() {
  const [players, setPlayers] = useState<PlayerSlot[]>(
    POSITIONS.map((p) => emptySlot(p.value))
  );

  const updatePlayer = <K extends keyof PlayerSlot>(
    index: number,
    field: K,
    value: PlayerSlot[K]
  ) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "tier") next[index].rank = "";
      return next;
    });
  };

  const switchMode = (index: number, mode: InputMode) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...emptySlot(next[index].position), mode };
      return next;
    });
  };

  const lookupNickname = async (index: number) => {
    const p = players[index];
    if (!p.gameName.trim() || !p.tagLine.trim()) {
      updatePlayer(index, "lookupError", "닉네임과 태그를 입력해주세요.");
      return;
    }
    updatePlayer(index, "lookupLoading", true);
    updatePlayer(index, "lookupError", null);

    try {
      const res = await fetch("/api/calc/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName: p.gameName, tagLine: p.tagLine }),
      });
      const data = await res.json();
      if (!res.ok) {
        updatePlayer(index, "lookupError", data.error || "조회 실패");
        updatePlayer(index, "resolvedTier", null);
        updatePlayer(index, "resolvedRank", null);
        updatePlayer(index, "resolvedLabel", null);
      } else {
        const tier = data.scoreTier as string | null;
        const rank = data.scoreRank as string | null;
        const season = data.scoreSeason as "S15" | "S16" | null;
        if (!tier || tier === "UNRANKED") {
          updatePlayer(index, "resolvedTier", null);
          updatePlayer(index, "resolvedRank", null);
          updatePlayer(index, "resolvedLabel", "언랭 (S15/S16 모두 기록 없음)");
          updatePlayer(index, "lookupError", null);
        } else {
          const suffix = season ? ` — ${season} 기준` : "";
          const lock = data.locked && season === "S16" ? " (확정)" : "";
          const label = `${TIER_LABELS[tier] ?? tier}${rank ? ` ${rank}` : ""}${lock}${suffix}`;
          updatePlayer(index, "resolvedTier", tier);
          updatePlayer(index, "resolvedRank", rank);
          updatePlayer(index, "resolvedLabel", label);
        }
      }
    } catch {
      updatePlayer(index, "lookupError", "조회 중 오류가 발생했습니다.");
    } finally {
      updatePlayer(index, "lookupLoading", false);
    }
  };

  const scores = players.map(scoreOf);
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
        티어를 직접 선택하거나, 닉네임으로 자동 조회할 수 있습니다.
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
              className="bg-gray-900/50 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                {/* Position */}
                <div className="w-16 text-center shrink-0">
                  <span className="text-lg">{posInfo?.icon || "?"}</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {posInfo?.label || "포지션"}
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => switchMode(i, "tier")}
                    className={`text-[11px] px-2 py-0.5 rounded ${
                      player.mode === "tier"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    티어
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode(i, "nickname")}
                    className={`text-[11px] px-2 py-0.5 rounded ${
                      player.mode === "nickname"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    닉네임
                  </button>
                </div>

                {player.mode === "tier" ? (
                  <>
                    <select
                      value={player.tier}
                      onChange={(e) =>
                        updatePlayer(i, "tier", e.target.value)
                      }
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">티어 선택</option>
                      <option value="SILVER_BELOW">실버 4 이하</option>
                      {CALC_TIERS.map((tier) =>
                        tier === "DIAMOND" ? (
                          <optgroup key={tier} label="다이아">
                            <option value={tier}>{TIER_LABELS[tier]}</option>
                            <option value="DIAMOND_ABOVE">
                              다이아 1 이상
                            </option>
                          </optgroup>
                        ) : (
                          <option key={tier} value={tier}>
                            {TIER_LABELS[tier]}
                          </option>
                        )
                      )}
                    </select>

                    {player.tier &&
                      player.tier !== "SILVER_BELOW" &&
                      player.tier !== "DIAMOND_ABOVE" && (
                        <select
                          value={player.rank}
                          onChange={(e) =>
                            updatePlayer(i, "rank", e.target.value)
                          }
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
                  </>
                ) : (
                  <div className="flex-1 flex gap-1">
                    <input
                      type="text"
                      value={player.gameName}
                      onChange={(e) =>
                        updatePlayer(i, "gameName", e.target.value)
                      }
                      placeholder="닉네임"
                      className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="flex items-center text-gray-500">#</span>
                    <input
                      type="text"
                      value={player.tagLine}
                      onChange={(e) =>
                        updatePlayer(i, "tagLine", e.target.value)
                      }
                      placeholder="KR1"
                      className="w-14 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => lookupNickname(i)}
                      disabled={player.lookupLoading}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded-lg whitespace-nowrap"
                    >
                      {player.lookupLoading ? "..." : "조회"}
                    </button>
                  </div>
                )}

                {/* Score */}
                <div className="w-16 text-right shrink-0">
                  <span className="text-yellow-400 font-bold">{scores[i]}</span>
                  <span className="text-gray-500 text-xs">점</span>
                </div>
              </div>

              {/* Nickname mode result/error */}
              {player.mode === "nickname" && (player.resolvedLabel || player.lookupError) && (
                <div className="ml-[120px] mt-2">
                  {player.resolvedLabel && !player.lookupError && (
                    <p className="text-xs text-gray-300">
                      → {player.resolvedLabel}
                    </p>
                  )}
                  {player.lookupError && (
                    <p className="text-xs text-red-400">{player.lookupError}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() =>
          setPlayers(POSITIONS.map((p) => emptySlot(p.value)))
        }
        className="mt-4 text-sm text-gray-400 hover:text-white transition"
      >
        초기화
      </button>
    </div>
  );
}
