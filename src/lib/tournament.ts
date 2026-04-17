// 대회/팀/대진표 관련 공통 유틸

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const TOURNAMENT_STATUSES = ["draft", "upcoming", "ongoing", "completed"] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const POSITIONS = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
export type Position = (typeof POSITIONS)[number];

export function isValidStatus(s: string): s is TournamentStatus {
  return (TOURNAMENT_STATUSES as readonly string[]).includes(s);
}

export interface PickEntry {
  position: string; // TOP/JUNGLE/MID/ADC/SUPPORT
  champion: string;
  memberId?: string | null;
  displayName?: string | null;
}
