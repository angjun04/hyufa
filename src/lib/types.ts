export interface UserProfile {
  id: string;
  email?: string;
  gameName: string;
  tagLine: string;
  currentTier: string | null;
  currentRank: string | null;
  currentLP: number | null;
  peakTierS15: string | null;
  peakRankS15: string | null;
  peakTierS16: string | null;
  peakRankS16: string | null;
  preferredPositions: string[];
  bio: string | null;
  isLookingForTeam?: boolean;
  createdAt?: string;
}

export interface TeamPostData {
  id: string;
  userId: string;
  user: {
    id: string;
    gameName: string;
    tagLine: string;
    currentTier: string | null;
    currentRank: string | null;
  };
  title: string;
  description: string;
  positions: string[];
  maxTier: string | null;
  minTier: string | null;
  createdAt: string;
}

export interface ContactRequestData {
  id: string;
  fromUserId: string;
  fromUser: {
    id: string;
    gameName: string;
    tagLine: string;
    currentTier: string | null;
    currentRank: string | null;
    preferredPositions: string[];
  };
  toUserId: string;
  toUser: {
    id: string;
    gameName: string;
    tagLine: string;
    currentTier: string | null;
    currentRank: string | null;
    preferredPositions: string[];
  };
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
