// LCMC 점수표 - 포지션별 티어 점수
// 팀별 총점 170점 이하

export const TEAM_POINT_CAP = 170;

// 티어 순서 (낮은 → 높은)
export const TIER_DIVISION_ORDER = [
  "SILVER_IV",
  "SILVER_III",
  "SILVER_II",
  "SILVER_I",
  "GOLD_IV",
  "GOLD_III",
  "GOLD_II",
  "GOLD_I",
  "PLATINUM_IV",
  "PLATINUM_III",
  "PLATINUM_II",
  "PLATINUM_I",
  "EMERALD_IV",
  "EMERALD_III",
  "EMERALD_II",
  "EMERALD_I",
  "DIAMOND_IV",
  "DIAMOND_III",
  "DIAMOND_II",
  "DIAMOND_I",
] as const;

// [TOP, JGL, MID, BOT, SUP]
export const POSITION_SCORES: Record<string, number[]> = {
  SILVER_IV:   [13,  9,  9, 11, 11],
  SILVER_III:  [15, 13, 12, 14, 14],
  SILVER_II:   [17, 15, 14, 16, 16],
  SILVER_I:    [19, 17, 16, 18, 18],
  GOLD_IV:     [21, 19, 18, 22, 21],
  GOLD_III:    [23, 21, 21, 25, 22],
  GOLD_II:     [25, 23, 24, 27, 24],
  GOLD_I:      [27, 26, 26, 29, 26],
  PLATINUM_IV: [30, 30, 29, 32, 28],
  PLATINUM_III:[32, 32, 32, 34, 30],
  PLATINUM_II: [36, 34, 34, 36, 32],
  PLATINUM_I:  [38, 36, 36, 38, 35],
  EMERALD_IV:  [40, 40, 41, 42, 38],
  EMERALD_III: [42, 42, 43, 44, 40],
  EMERALD_II:  [44, 44, 46, 45, 42],
  EMERALD_I:   [46, 46, 48, 47, 44],
  DIAMOND_IV:  [48, 48, 51, 50, 47],
  DIAMOND_III: [50, 50, 53, 52, 49],
  DIAMOND_II:  [52, 53, 55, 54, 51],
  DIAMOND_I:   [56, 58, 59, 58, 55],
};

// 포지션 인덱스 매핑
const POSITION_INDEX: Record<string, number> = {
  TOP: 0,
  JUNGLE: 1,
  MID: 2,
  BOT: 3,
  SUPPORT: 4,
};

export function getTierScore(
  tier: string,
  rank: string,
  position: string
): number {
  const posIdx = POSITION_INDEX[position];
  if (posIdx === undefined) return 0;

  if (!tier || tier === "UNRANKED") return 0;

  // 계산기 전용 특수 값
  if (tier === "DIAMOND_ABOVE") return POSITION_SCORES["DIAMOND_I"][posIdx];
  if (tier === "SILVER_BELOW") return POSITION_SCORES["SILVER_IV"][posIdx];

  // 다이아1 이상 (마스터, 그마, 챌린저)
  if (
    tier === "MASTER" ||
    tier === "GRANDMASTER" ||
    tier === "CHALLENGER" ||
    (tier === "DIAMOND" && rank === "I")
  ) {
    return POSITION_SCORES["DIAMOND_I"][posIdx];
  }

  // 실버4 이하 (브론즈, 아이언)
  if (tier === "IRON" || tier === "BRONZE" || (tier === "SILVER" && rank === "IV")) {
    return POSITION_SCORES["SILVER_IV"][posIdx];
  }

  const key = `${tier}_${rank}`;
  const scores = POSITION_SCORES[key];
  if (!scores) return 0;
  return scores[posIdx];
}

// --- 표시용 유틸 ---

export const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

export const CALC_TIERS = [
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
] as const;

export const DIVISIONS = ["IV", "III", "II", "I"] as const;

export const TIER_LABELS: Record<string, string> = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  EMERALD: "에메랄드",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
  UNRANKED: "언랭",
};

export const TIER_COLORS: Record<string, string> = {
  IRON: "bg-stone-400 text-white",
  BRONZE: "bg-amber-700 text-white",
  SILVER: "bg-slate-400 text-white",
  GOLD: "bg-yellow-500 text-white",
  PLATINUM: "bg-cyan-600 text-white",
  EMERALD: "bg-emerald-500 text-white",
  DIAMOND: "bg-blue-400 text-white",
  MASTER: "bg-purple-500 text-white",
  GRANDMASTER: "bg-red-500 text-white",
  CHALLENGER: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
  UNRANKED: "bg-gray-500 text-white",
};

export function formatTier(tier: string | null, rank: string | null): string {
  if (!tier || tier === "UNRANKED") return "언랭";
  const label = TIER_LABELS[tier] || tier;
  if (tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER") {
    return label;
  }
  return `${label} ${rank}`;
}

export const POSITIONS = [
  { value: "TOP", label: "탑", icon: "🛡️" },
  { value: "JUNGLE", label: "정글", icon: "🌲" },
  { value: "MID", label: "미드", icon: "⚡" },
  { value: "BOT", label: "원딜", icon: "🏹" },
  { value: "SUPPORT", label: "서포터", icon: "💚" },
] as const;
