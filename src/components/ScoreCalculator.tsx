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
  tier: string;
  rank: string;
  games: string;
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
    const s16 = normalizedSeasonScore(p.resolvedS16, p.position);
    const s15 = normalizedSeasonScore(p.resolvedS15, p.position);
    if (!s16 && !s15)
      return { total: 0, chosenSeason: null, chosenTier: null, chosenRank: null, chosenGames: null, penalty: 0 };
    if (!s16) {
      return { total: s15!.score, chosenSeason: "S15", chosenTier: s15!.tier, chosenRank: s15!.rank, chosenGames: s15!.games, penalty: gamesPenalty(s15!.games) };
    }
    if (!s15) {
      return { total: s16.score, chosenSeason: "S16", chosenTier: s16.tier, chosenRank: s16.rank, chosenGames: s16.games, penalty: gamesPenalty(s16.games) };
    }
    const s15Base = s15.score - gamesPenalty(s15.games);
    const s16Base = s16.score - gamesPenalty(s16.games);
    let pick: typeof s15;
    if (s15Base > s16Base) pick = s15;
    else if (s16Base > s15Base) pick = s16;
    else {
      const g15 = s15.games ?? -1;
      const g16 = s16.games ?? -1;
      pick = g15 >= g16 ? s15 : s16;
    }
    const season: "S15" | "S16" = pick === s15 ? "S15" : "S16";
    return { total: pick.score, chosenSeason: season, chosenTier: pick.tier, chosenRank: pick.rank, chosenGames: pick.games, penalty: gamesPenalty(pick.games) };
  }

  if (!p.tier)
    return { total: 0, chosenSeason: null, chosenTier: null, chosenRank: null, chosenGames: null, penalty: 0 };
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

const inputCls =
  "bg-[#0b0d11] border border-[#232830] rounded px-2 py-1.5 text-[13px] text-white focus:border-[#e08a3c] focus:outline-none";

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
  const fillPct = Math.min((totalScore / TEAM_POINT_CAP) * 100, 100);

  return (
    <section className="bg-[#14171d] border border-[#232830] rounded-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#232830]">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">
            LCMC TEAM POINT
          </p>
          <h2 className="text-[15px] font-bold text-white">팀 포인트 계산기</h2>
        </div>
        <div className={`text-right ${isOverCap ? "text-[#e3603f]" : "text-white"}`}>
          <p className="text-[24px] font-extrabold leading-none tabular-nums">
            {totalScore}
            <span className="text-[#6c727f] text-base font-normal">/{TEAM_POINT_CAP}</span>
          </p>
          <p className="text-[11px] mt-0.5">
            {isOverCap ? (
              <span className="text-[#e3603f]">{Math.abs(remaining)}점 초과</span>
            ) : (
              <span className="text-[#6c727f]">{remaining}점 남음</span>
            )}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-[#0b0d11]">
        <div
          className={`h-full transition-all ${
            isOverCap
              ? "bg-[#e3603f]"
              : totalScore > TEAM_POINT_CAP * 0.85
                ? "bg-[#e6b73f]"
                : "bg-[#e08a3c]"
          }`}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1a1e25]">
        {players.map((player, i) => {
          const posInfo = POSITIONS.find((p) => p.value === player.position);
          const result = results[i];
          return (
            <div key={i} className="px-3 py-2.5 hover:bg-[#1a1e25]/40">
              <div className="flex items-center gap-2">
                {/* Position */}
                <div className="w-12 shrink-0 flex flex-col items-center">
                  <span className="text-base leading-none">{posInfo?.icon}</span>
                  <span className="text-[10px] text-[#6c727f] mt-0.5">
                    {posInfo?.label}
                  </span>
                </div>

                {/* Mode toggle */}
                <div className="flex shrink-0 rounded overflow-hidden border border-[#232830]">
                  <button
                    type="button"
                    onClick={() => switchMode(i, "tier")}
                    className={`text-[10px] px-1.5 py-0.5 ${
                      player.mode === "tier"
                        ? "bg-[#e08a3c] text-black font-semibold"
                        : "text-[#6c727f] hover:text-white"
                    }`}
                  >
                    티어
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode(i, "nickname")}
                    className={`text-[10px] px-1.5 py-0.5 border-l border-[#232830] ${
                      player.mode === "nickname"
                        ? "bg-[#e08a3c] text-black font-semibold"
                        : "text-[#6c727f] hover:text-white"
                    }`}
                  >
                    닉네임
                  </button>
                </div>

                {/* Inputs */}
                {player.mode === "tier" ? (
                  <>
                    <select
                      value={player.tier}
                      onChange={(e) => updatePlayer(i, "tier", e.target.value)}
                      className={`flex-1 min-w-0 ${inputCls}`}
                    >
                      <option value="">티어 선택</option>
                      <option value="SILVER_BELOW">실버 4 이하</option>
                      {CALC_TIERS.map((tier) =>
                        tier === "DIAMOND" ? (
                          <optgroup key={tier} label="다이아">
                            <option value={tier}>{TIER_LABELS[tier]}</option>
                            <option value="DIAMOND_ABOVE">다이아 1 이상</option>
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
                          onChange={(e) => updatePlayer(i, "rank", e.target.value)}
                          className={`w-14 ${inputCls}`}
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
                      className={`w-16 ${inputCls}`}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex gap-1 min-w-0">
                    <input
                      type="text"
                      value={player.gameName}
                      onChange={(e) => updatePlayer(i, "gameName", e.target.value)}
                      placeholder="닉네임"
                      className={`flex-1 min-w-0 ${inputCls}`}
                    />
                    <span className="self-center text-[#6c727f] text-xs">#</span>
                    <input
                      type="text"
                      value={player.tagLine}
                      onChange={(e) => updatePlayer(i, "tagLine", e.target.value)}
                      placeholder="KR1"
                      className={`w-12 ${inputCls}`}
                    />
                    <button
                      type="button"
                      onClick={() => lookupNickname(i)}
                      disabled={player.lookupLoading}
                      className="text-[11px] bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black font-semibold px-2 rounded"
                    >
                      {player.lookupLoading ? "…" : "조회"}
                    </button>
                  </div>
                )}

                {/* Score */}
                <div className="w-14 text-right shrink-0">
                  <span className="text-[#e6b73f] font-extrabold tabular-nums text-[15px]">
                    {result.total}
                  </span>
                  <span className="text-[#6c727f] text-[10px] ml-0.5">점</span>
                </div>
              </div>

              {/* Result line */}
              {((player.mode === "nickname" &&
                (result.chosenSeason || player.lookupError)) ||
                (player.mode === "tier" && result.penalty > 0)) && (
                <div className="ml-[60px] mt-1 text-[11px]">
                  {player.lookupError && (
                    <span className="text-[#e3603f]">{player.lookupError}</span>
                  )}
                  {!player.lookupError && player.mode === "nickname" && result.chosenSeason && (
                    <span className="text-[#a3a8b3]">
                      {result.chosenSeason} ·{" "}
                      {result.chosenTier && result.chosenTier !== "UNRANKED"
                        ? `${TIER_LABELS[result.chosenTier] ?? result.chosenTier}${result.chosenRank ? ` ${result.chosenRank}` : ""}`
                        : "언랭(실4↓ 점수)"}
                      {result.chosenGames != null && ` · ${result.chosenGames}판`}
                      {result.penalty > 0 && (
                        <span className="text-[#e3603f]"> · +{result.penalty}</span>
                      )}
                      {player.locked && result.chosenSeason === "S16" && (
                        <span className="text-[#e6b73f]"> · 확정</span>
                      )}
                    </span>
                  )}
                  {!player.lookupError && player.mode === "tier" && result.penalty > 0 && (
                    <span className="text-[#e3603f]">
                      {player.games}판 · 패널티 +{result.penalty}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#232830] text-[11px] text-[#6c727f]">
        <span>판수 패널티: 20판↓ +4 / 40판↓ +2</span>
        <button
          onClick={() => setPlayers(POSITIONS.map((p) => emptySlot(p.value)))}
          className="hover:text-white transition"
        >
          초기화
        </button>
      </div>
    </section>
  );
}
