"use client";

import { useState } from "react";
import {
  CALC_TIERS,
  DIVISIONS,
  TIER_LABELS,
  TEAM_POINT_CAP,
  getTierScore,
  getTierScoreWithPenalty,
  gamesPenalty,
  POSITIONS,
} from "@/lib/tierScore";

type InputMode = "tier" | "nickname";

interface SeasonData {
  tier: string | null;
  rank: string | null;
  games: number | null;
}

interface PlayerSlot {
  position: string;
  mode: InputMode;
  // 티어 모드
  tier: string;
  rank: string;
  games: string; // 판수 텍스트 입력 (빈 문자열이면 패널티 미적용)
  // 닉네임 모드
  gameName: string;
  tagLine: string;
  resolvedS16: SeasonData | null;
  resolvedS15: SeasonData | null;
  locked: boolean;
  lookupError: string | null;
  lookupLoading: boolean;
}

const emptySlot = (position: string): PlayerSlot => ({
  position,
  mode: "tier",
  tier: "",
  rank: "",
  games: "",
  gameName: "",
  tagLine: "",
  resolvedS16: null,
  resolvedS15: null,
  locked: false,
  lookupError: null,
  lookupLoading: false,
});

function normalizedSeasonScore(
  season: SeasonData | null,
  position: string
): { score: number; tier: string | null; rank: string | null; games: number | null } | null {
  if (!season) return null;
  const base = getTierScore(season.tier ?? "", season.rank ?? "", position);
  if (base === 0 && (!season.tier || season.tier === "")) return null;
  const penalty = gamesPenalty(season.games);
  return {
    score: base + penalty,
    tier: season.tier,
    rank: season.rank,
    games: season.games,
  };
}

interface ScoreResult {
  total: number;
  chosenSeason: "S15" | "S16" | null;
  chosenTier: string | null;
  chosenRank: string | null;
  chosenGames: number | null;
  penalty: number;
}

function scoreOf(p: PlayerSlot): ScoreResult {
  if (p.mode === "nickname") {
    const s16Raw = p.resolvedS16;
    const s15Raw = p.resolvedS15;
    const s16 = normalizedSeasonScore(s16Raw, p.position);
    const s15 = normalizedSeasonScore(s15Raw, p.position);

    if (!s16 && !s15) {
      return { total: 0, chosenSeason: null, chosenTier: null, chosenRank: null, chosenGames: null, penalty: 0 };
    }
    if (!s16) {
      return {
        total: s15!.score,
        chosenSeason: "S15",
        chosenTier: s15!.tier,
        chosenRank: s15!.rank,
        chosenGames: s15!.games,
        penalty: gamesPenalty(s15!.games),
      };
    }
    if (!s15) {
      return {
        total: s16.score,
        chosenSeason: "S16",
        chosenTier: s16.tier,
        chosenRank: s16.rank,
        chosenGames: s16.games,
        penalty: gamesPenalty(s16.games),
      };
    }

    // 두 시즌 모두 있으면:
    //   1) 먼저 티어(base 점수)가 더 높은 쪽 선택
    //   2) 티어 동률이면 판수 많은 쪽(= 패널티 적은 쪽) 선택
    const s15Base = s15.score - gamesPenalty(s15.games);
    const s16Base = s16.score - gamesPenalty(s16.games);
    let pick: typeof s15;
    if (s15Base > s16Base) pick = s15;
    else if (s16Base > s15Base) pick = s16;
    else {
      // 동률 — 판수 많은 쪽 (null은 최저 취급)
      const g15 = s15.games ?? -1;
      const g16 = s16.games ?? -1;
      pick = g15 >= g16 ? s15 : s16;
    }
    const season: "S15" | "S16" = pick === s15 ? "S15" : "S16";
    return {
      total: pick.score,
      chosenSeason: season,
      chosenTier: pick.tier,
      chosenRank: pick.rank,
      chosenGames: pick.games,
      penalty: gamesPenalty(pick.games),
    };
  }

  // 티어 모드
  if (!p.tier) return { total: 0, chosenSeason: null, chosenTier: null, chosenRank: null, chosenGames: null, penalty: 0 };
  const gamesNum = p.games === "" ? null : parseInt(p.games, 10);
  const rankForScore =
    p.tier === "SILVER_BELOW" || p.tier === "DIAMOND_ABOVE" ? "" : p.rank;
  if (
    p.tier !== "SILVER_BELOW" &&
    p.tier !== "DIAMOND_ABOVE" &&
    p.tier !== "UNRANKED" &&
    !p.rank
  ) {
    return { total: 0, chosenSeason: null, chosenTier: null, chosenRank: null, chosenGames: null, penalty: 0 };
  }
  const total = getTierScoreWithPenalty(p.tier, rankForScore, p.position, gamesNum);
  return {
    total,
    chosenSeason: null,
    chosenTier: p.tier,
    chosenRank: p.rank || null,
    chosenGames: gamesNum,
    penalty: gamesPenalty(gamesNum),
  };
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
        updatePlayer(index, "resolvedS16", null);
        updatePlayer(index, "resolvedS15", null);
      } else {
        updatePlayer(index, "resolvedS16", data.s16);
        updatePlayer(index, "resolvedS15", data.s15);
        updatePlayer(index, "locked", !!data.locked);
        updatePlayer(index, "lookupError", null);
      }
    } catch {
      updatePlayer(index, "lookupError", "조회 중 오류가 발생했습니다.");
    } finally {
      updatePlayer(index, "lookupLoading", false);
    }
  };

  const results = players.map(scoreOf);
  const totalScore = results.reduce((a, b) => a + b.total, 0);
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
        판수 패널티: 20판 이하 +4, 40판 이하 +2. 닉네임 모드는 S15/S16 중 유리한
        쪽 자동 선택.
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
          const result = results[i];

          return (
            <div key={i} className="bg-gray-900/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-16 text-center shrink-0">
                  <span className="text-lg">{posInfo?.icon || "?"}</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {posInfo?.label || "포지션"}
                  </p>
                </div>

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
                      onChange={(e) => updatePlayer(i, "tier", e.target.value)}
                      className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
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
                          className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
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

                    <input
                      type="number"
                      min={0}
                      value={player.games}
                      onChange={(e) => updatePlayer(i, "games", e.target.value)}
                      placeholder="판수"
                      title="해당 티어 달성 시즌 판수 (비우면 패널티 없음)"
                      className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </>
                ) : (
                  <div className="flex-1 flex gap-1 min-w-0">
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

                <div className="w-16 text-right shrink-0">
                  <span className="text-yellow-400 font-bold">
                    {result.total}
                  </span>
                  <span className="text-gray-500 text-xs">점</span>
                </div>
              </div>

              {/* 결과 / 에러 영역 */}
              {((player.mode === "nickname" &&
                (result.chosenSeason || player.lookupError)) ||
                (player.mode === "tier" && result.penalty > 0)) && (
                <div className="ml-[120px] mt-2 text-xs">
                  {player.lookupError && (
                    <p className="text-red-400">{player.lookupError}</p>
                  )}
                  {!player.lookupError && player.mode === "nickname" && result.chosenSeason && (
                    <p className="text-gray-300">
                      → {result.chosenSeason} 기준{" "}
                      {result.chosenTier && result.chosenTier !== "UNRANKED"
                        ? `${TIER_LABELS[result.chosenTier] ?? result.chosenTier}${result.chosenRank ? ` ${result.chosenRank}` : ""}`
                        : "언랭 (실4 이하 점수)"}
                      {result.chosenGames != null && ` · ${result.chosenGames}판`}
                      {result.penalty > 0 && (
                        <span className="text-red-400">
                          {" "}· 판수 패널티 +{result.penalty}
                        </span>
                      )}
                      {player.locked && result.chosenSeason === "S16" && " (확정)"}
                    </p>
                  )}
                  {!player.lookupError && player.mode === "tier" && result.penalty > 0 && (
                    <p className="text-red-400">
                      판수 {player.games}판 → 패널티 +{result.penalty}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setPlayers(POSITIONS.map((p) => emptySlot(p.value)))}
        className="mt-4 text-sm text-gray-400 hover:text-white transition"
      >
        초기화
      </button>
    </div>
  );
}
