export interface UserProfile {
  id: string;
  username: string;
  phoneNumber?: string;
  gameName: string;
  tagLine: string;
  // 캐시에서 가져오는 현재 시즌 정보
  currentTier: string | null;
  currentRank: string | null;
  currentLP: number | null;
  // S16 peak — 시즌 lock되면 confirmed 값, 그 전엔 진행 중 max
  peakTierS16: string | null;
  peakRankS16: string | null;
  peakLPS16: number | null;
  gamesS16: number | null;
  peakLockedAt: string | null;
  // S15 peak — fow.kr 크롤 결과 (영구)
  peakTierS15: string | null;
  peakRankS15: string | null;
  peakSourceS15: string | null;
  gamesS15: number | null;
  // 캐시 메타
  refreshedAt: string | null;
  preferredPositions: string[];
  bio: string | null;
  isLookingForTeam?: boolean;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface PublicPlayerInfo {
  id: string;
  gameName: string;
  tagLine: string;
  currentTier: string | null;
  currentRank: string | null;
  preferredPositions: string[];
}

export interface TeamMemberInfo {
  puuid: string;
  gameName: string;
  tagLine: string;
  currentTier: string | null;
  currentRank: string | null;
  currentLP: number | null;
  peakTierS16: string | null;
  peakRankS16: string | null;
  peakTierS15: string | null;
  peakRankS15: string | null;
}

export interface TeamPostData {
  id: string;
  userId: string;
  user: PublicPlayerInfo;
  title: string;
  description: string;
  positions: string[];
  maxTier: string | null;
  minTier: string | null;
  members: TeamMemberInfo[];
  createdAt: string;
}

export interface ContactRequestData {
  id: string;
  fromUserId: string;
  fromUser: PublicPlayerInfo;
  toUserId: string;
  toUser: PublicPlayerInfo;
  teamPost?: { id: string; title: string } | null;
  type: string;
  status: string;
  createdAt: string;
}

export interface MessageData {
  id: string;
  contactId: string;
  senderId: string;
  sender: { id: string; gameName: string; tagLine: string };
  content: string;
  createdAt: string;
}
