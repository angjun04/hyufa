"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TierBadge from "@/components/TierBadge";
import { POSITIONS, TIERS, DIVISIONS, TIER_LABELS } from "@/lib/tierScore";
import type { UserProfile, ContactRequestData } from "@/lib/types";

function formatRelative(iso: string | null): string {
  if (!iso) return "기록 없음";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<ContactRequestData[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    preferredPositions: [] as string[],
    bio: "",
    isLookingForTeam: false,
    peakTierS15: "",
    peakRankS15: "",
    gamesS15: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [faToggling, setFaToggling] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data: UserProfile) => {
          setProfile(data);
          setEditForm({
            preferredPositions: data.preferredPositions || [],
            bio: data.bio || "",
            isLookingForTeam: data.isLookingForTeam || false,
            peakTierS15: data.peakTierS15 || "",
            peakRankS15: data.peakRankS15 || "",
            gamesS15: data.gamesS15 != null ? String(data.gamesS15) : "",
          });
        });
      fetch("/api/contact")
        .then((r) => r.json())
        .then(setContacts);
    }
  }, [session]);

  const handleRefreshTier = async () => {
    setRefreshing(true);
    setRefreshError("");
    const res = await fetch("/api/profile", { method: "PUT" });
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              currentTier: data.currentTier,
              currentRank: data.currentRank,
              currentLP: data.currentLP,
              peakTierS16: prev.peakLockedAt ? prev.peakTierS16 : data.peakTierS16,
              peakRankS16: prev.peakLockedAt ? prev.peakRankS16 : data.peakRankS16,
              peakLPS16: prev.peakLockedAt ? prev.peakLPS16 : data.peakLPS16,
              refreshedAt: data.refreshedAt,
            }
          : prev
      );
    } else {
      const err = await res.json();
      setRefreshError(err.error || "갱신 실패");
    }
    setRefreshing(false);
  };

  const handleToggleFA = async (next: boolean) => {
    setFaToggling(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLookingForTeam: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, isLookingForTeam: updated.isLookingForTeam } : prev));
      setEditForm((prev) => ({ ...prev, isLookingForTeam: updated.isLookingForTeam }));
    }
    setFaToggling(false);
  };

  const handleSaveProfile = async () => {
    const payload = {
      ...editForm,
      gamesS15:
        editForm.gamesS15 === "" ? null : parseInt(editForm.gamesS15, 10),
    };
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditMode(false);
    }
  };

  const handleContactAction = async (contactId: string, action: string) => {
    const res = await fetch(`/api/contact/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    if (res.ok) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, status: action } : c))
      );
    }
  };

  if (status === "loading" || !profile) {
    return (
      <div className="text-center py-20 text-gray-500">불러오는 중...</div>
    );
  }

  const received = contacts.filter((c) => c.toUserId === session?.user?.id);
  const sent = contacts.filter((c) => c.fromUserId === session?.user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.gameName}
              <span className="text-gray-400 font-normal">
                #{profile.tagLine}
              </span>
            </h1>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            {profile.isAdmin && (
              <Link
                href="/admin"
                className="inline-block mt-1 text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-full hover:bg-purple-600/30"
              >
                어드민 페이지
              </Link>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleRefreshTier}
                disabled={refreshing}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? "갱신 중..." : "티어 갱신"}
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                {editMode ? "취소" : "수정"}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              마지막 갱신: {formatRelative(profile.refreshedAt)}
            </p>
          </div>
        </div>

        {refreshError && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-xs p-2 rounded-lg mb-3">
            {refreshError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <span className="text-xs text-gray-500">S16 현재</span>
            <div className="mt-1">
              <TierBadge
                tier={profile.currentTier}
                rank={profile.currentRank}
                lp={profile.currentLP}
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500">
              S16 최고{profile.peakLockedAt ? " (확정)" : " (진행 중)"}
            </span>
            <div className="mt-1">
              <TierBadge tier={profile.peakTierS16} rank={profile.peakRankS16} />
            </div>
            {profile.gamesS16 != null && (
              <p className="text-[10px] text-gray-500 mt-1">
                {profile.gamesS16}판
              </p>
            )}
          </div>
          <div>
            <span className="text-xs text-gray-500">
              S15 최고
              {profile.peakSourceS15 === "fow"
                ? " (fow.kr)"
                : profile.peakSourceS15 === "manual"
                  ? " (수동)"
                  : ""}
            </span>
            <div className="mt-1">
              <TierBadge tier={profile.peakTierS15} rank={profile.peakRankS15} />
            </div>
            {profile.gamesS15 != null && (
              <p className="text-[10px] text-gray-500 mt-1">
                {profile.gamesS15}판
              </p>
            )}
          </div>
        </div>

        {profile.peakLockedAt && (
          <p className="text-xs text-yellow-400 mb-3">
            ⚠ S16 최고 티어가 확정되었습니다 (
            {new Date(profile.peakLockedAt).toLocaleString("ko-KR")}). 이후 티어
            갱신은 현재 티어에만 반영됩니다.
          </p>
        )}

        {/* FA 마켓 토글 — 항상 노출 (edit mode 무관) */}
        <label className="flex items-center gap-3 cursor-pointer mb-4 bg-gray-900/50 rounded-lg px-4 py-3 hover:bg-gray-900/70 transition">
          <input
            type="checkbox"
            checked={profile.isLookingForTeam || false}
            disabled={faToggling}
            onChange={(e) => handleToggleFA(e.target.checked)}
            className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-200 font-medium">
            🎮 FA 마켓에 등록 (팀 찾는 중)
          </span>
          {faToggling && (
            <span className="text-xs text-gray-500 ml-auto">저장 중...</span>
          )}
          {!faToggling && profile.isLookingForTeam && (
            <span className="text-xs text-green-400 ml-auto">노출 중</span>
          )}
        </label>

        {editMode ? (
          <div className="space-y-4 mt-6 border-t border-gray-700 pt-4">
            {/* S15 peak — fow.kr에 없으면 수동 입력 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                S15 최고 티어
                <span className="ml-2 text-xs text-gray-500">
                  (fow.kr에 없으면 직접 입력)
                </span>
              </label>
              <div className="flex gap-2">
                <select
                  value={editForm.peakTierS15}
                  onChange={(e) => {
                    const t = e.target.value;
                    setEditForm({
                      ...editForm,
                      peakTierS15: t,
                      peakRankS15:
                        t === "MASTER" ||
                        t === "GRANDMASTER" ||
                        t === "CHALLENGER"
                          ? ""
                          : editForm.peakRankS15,
                    });
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">기록 없음</option>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {TIER_LABELS[t]}
                    </option>
                  ))}
                </select>
                {editForm.peakTierS15 &&
                  !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
                    editForm.peakTierS15
                  ) && (
                    <select
                      value={editForm.peakRankS15}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          peakRankS15: e.target.value,
                        })
                      }
                      className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">단계</option>
                      {DIVISIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  )}
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">
                  S15 솔로랭크 판수 (fow 자동 값이 틀리면 직접 입력)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editForm.gamesS15}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gamesS15: e.target.value })
                  }
                  placeholder="예: 50"
                  className="w-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            {/* Positions */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                선호 포지션
              </label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        preferredPositions:
                          prev.preferredPositions.includes(pos.value)
                            ? prev.preferredPositions.filter(
                                (p) => p !== pos.value
                              )
                            : [...prev.preferredPositions, pos.value],
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      editForm.preferredPositions.includes(pos.value)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {pos.icon} {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">소개</label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {profile.isLookingForTeam && (
              <span className="inline-block bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded-full mb-2">
                FA 등록 중
              </span>
            )}
            {profile.bio && (
              <p className="text-gray-400 text-sm">{profile.bio}</p>
            )}
          </div>
        )}
      </div>

      {/* Contacts Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">받은 컨택</h2>
        {received.length === 0 ? (
          <p className="text-gray-500 text-sm">받은 컨택이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {received.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
              >
                <div>
                  <span className="text-white font-medium">
                    {c.fromUser.gameName}
                    <span className="text-gray-500">
                      #{c.fromUser.tagLine}
                    </span>
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {c.type === "fa_contact" ? "FA 컨택" : "팀 참가 신청"}
                  </span>
                  {c.teamPost && (
                    <span className="text-gray-500 text-xs ml-1">
                      ({c.teamPost.title})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {c.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleContactAction(c.id, "accepted")}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleContactAction(c.id, "rejected")}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition"
                      >
                        거절
                      </button>
                    </>
                  ) : c.status === "accepted" ? (
                    <Link
                      href={`/chat/${c.id}`}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition"
                    >
                      채팅
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500">거절됨</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">보낸 컨택</h2>
        {sent.length === 0 ? (
          <p className="text-gray-500 text-sm">보낸 컨택이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {sent.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
              >
                <div>
                  <span className="text-white font-medium">
                    {c.toUser.gameName}
                    <span className="text-gray-500">#{c.toUser.tagLine}</span>
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {c.type === "fa_contact" ? "FA 컨택" : "팀 참가 신청"}
                  </span>
                </div>
                <div>
                  {c.status === "pending" && (
                    <span className="text-xs text-yellow-400">대기 중</span>
                  )}
                  {c.status === "accepted" && (
                    <Link
                      href={`/chat/${c.id}`}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition"
                    >
                      채팅
                    </Link>
                  )}
                  {c.status === "rejected" && (
                    <span className="text-xs text-gray-500">거절됨</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
