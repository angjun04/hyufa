// 멸망전 스타일 티어 점수표
// TODO: 실제 점수표로 교체 필요
export const TIER_SCORES: Record<string, number> = {
  IRON_IV: 0,
  IRON_III: 1,
  IRON_II: 2,
  IRON_I: 3,
  BRONZE_IV: 4,
  BRONZE_III: 5,
  BRONZE_II: 6,
  BRONZE_I: 7,
  SILVER_IV: 8,
  SILVER_III: 9,
  SILVER_II: 10,
  SILVER_I: 11,
  GOLD_IV: 12,
  GOLD_III: 13,
  GOLD_II: 14,
  GOLD_I: 15,
  PLATINUM_IV: 16,
  PLATINUM_III: 17,
  PLATINUM_II: 18,
  PLATINUM_I: 19,
  EMERALD_IV: 20,
  EMERALD_III: 21,
  EMERALD_II: 22,
  EMERALD_I: 23,
  DIAMOND_IV: 24,
  DIAMOND_III: 25,
  DIAMOND_II: 26,
  DIAMOND_I: 27,
  MASTER_I: 28,
  GRANDMASTER_I: 32,
  CHALLENGER_I: 36,
  UNRANKED: 0,
};

// 팀 점수 상한 (5인 기준)
export const TEAM_POINT_CAP = 90;

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

export function getTierScore(tier: string, rank: string): number {
  if (!tier || tier === "UNRANKED") return 0;
  const key =
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER"
      ? `${tier}_I`
      : `${tier}_${rank}`;
  return TIER_SCORES[key] ?? 0;
}

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
  { value: "ADC", label: "원딜", icon: "🏹" },
  { value: "SUPPORT", label: "서포터", icon: "💚" },
] as const;
