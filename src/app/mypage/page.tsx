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
  return `${Math.floor(hr / 24)}일 전`;
}

const inputCls =
  "bg-[#0b0d11] border border-[#232830] rounded px-3 py-2 text-[13px] text-white focus:border-[#e08a3c] focus:outline-none";

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
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile").then(async (r) => {
        if (!r.ok) {
          // 세션은 살아있지만 user 레코드가 없는 경우 (DB 리셋 등) — 강제 로그아웃
          router.push("/auth/login");
          return;
        }
        const data: UserProfile = await r.json();
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
      fetch("/api/contact").then((r) => (r.ok ? r.json() : [])).then(setContacts);
    }
  }, [session, router]);

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

  const handleSaveProfile = async () => {
    const payload = {
      ...editForm,
      gamesS15: editForm.gamesS15 === "" ? null : parseInt(editForm.gamesS15, 10),
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
    return <div className="text-center py-20 text-[#6c727f] text-sm">불러오는 중...</div>;
  }

  const received = contacts.filter((c) => c.toUserId === session?.user?.id);
  const sent = contacts.filter((c) => c.fromUserId === session?.user?.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Profile Header */}
      <section className="bg-[#14171d] border border-[#232830] rounded-md">
        <div className="px-4 py-3 flex items-start justify-between border-b border-[#232830]">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold text-white leading-tight">
              {profile.gameName}
              <span className="text-[#6c727f] font-normal text-sm ml-0.5">
                #{profile.tagLine}
              </span>
            </h1>
            <p className="text-[12px] text-[#6c727f] mt-0.5">
              @{profile.username}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={handleRefreshTier}
                disabled={refreshing}
                className="text-[11px] bg-[#1a1e25] hover:bg-[#232830] border border-[#232830] text-[#a3a8b3] hover:text-white px-2.5 py-1 rounded transition disabled:opacity-50"
              >
                {refreshing ? "갱신 중…" : "↻ 티어 갱신"}
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-[11px] bg-[#e08a3c] hover:bg-[#f09a48] text-black px-2.5 py-1 rounded font-semibold transition"
              >
                {editMode ? "취소" : "수정"}
              </button>
            </div>
            <p className="text-[10px] text-[#6c727f]">
              마지막 갱신: {formatRelative(profile.refreshedAt)}
            </p>
          </div>
        </div>

        {refreshError && (
          <div className="mx-4 mt-3 bg-[#e3603f]/10 border border-[#e3603f]/40 text-[#e3603f] text-[12px] p-2 rounded">
            {refreshError}
          </div>
        )}

        {/* Tier grid */}
        <div className="grid grid-cols-3 divide-x divide-[#232830] border-b border-[#232830]">
          {[
            {
              label: "S16 현재",
              tier: profile.currentTier,
              rank: profile.currentRank,
              lp: profile.currentLP,
              games: profile.gamesS16,
            },
            {
              label: profile.peakLockedAt ? "S16 최고 (확정)" : "S16 최고",
              tier: profile.peakTierS16,
              rank: profile.peakRankS16,
              lp: profile.peakLPS16,
              games: profile.peakLockedAt ? null : profile.gamesS16,
              suffix: profile.peakLockedAt ? " · LOCKED" : null,
            },
            {
              label:
                "S15 최고" +
                (profile.peakSourceS15 === "fow"
                  ? " (fow)"
                  : profile.peakSourceS15 === "manual"
                    ? " (수동)"
                    : ""),
              tier: profile.peakTierS15,
              rank: profile.peakRankS15,
              lp: null,
              games: profile.gamesS15,
            },
          ].map((c, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6c727f] mb-1.5">
                {c.label}
              </p>
              <TierBadge tier={c.tier} rank={c.rank} lp={c.lp} size="md" />
              {c.games != null && (
                <p className="text-[10px] text-[#6c727f] mt-1.5 tabular-nums">
                  {c.games}판
                </p>
              )}
            </div>
          ))}
        </div>

        {profile.peakLockedAt && (
          <div className="px-4 py-2 text-[11px] text-[#e6b73f] bg-[#e6b73f]/5 border-b border-[#232830]">
            S16 최고 티어가 확정되었습니다 ({new Date(profile.peakLockedAt).toLocaleString("ko-KR")}). 이후 갱신은 현재 티어에만 반영.
          </div>
        )}

        {/* FA toggle — always visible */}
        <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1a1e25]/40 transition border-b border-[#232830]">
          <input
            type="checkbox"
            checked={profile.isLookingForTeam || false}
            disabled={faToggling}
            onChange={(e) => handleToggleFA(e.target.checked)}
            className="w-4 h-4 accent-[#e08a3c]"
          />
          <span className="text-[13px] text-[#cdd1d8] font-medium">
            FA 마켓에 노출
          </span>
          {faToggling && (
            <span className="text-[11px] text-[#6c727f] ml-auto">저장 중…</span>
          )}
          {!faToggling && profile.isLookingForTeam && (
            <span className="text-[11px] text-[#2bc66c] ml-auto">● 노출 중</span>
          )}
          {!faToggling && !profile.isLookingForTeam && (
            <span className="text-[11px] text-[#6c727f] ml-auto">○ 비공개</span>
          )}
        </label>

        {/* Position + bio area */}
        {!editMode ? (
          <div className="px-4 py-3">
            {profile.preferredPositions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {profile.preferredPositions.map((p) => {
                  const info = POSITIONS.find((x) => x.value === p);
                  return (
                    <span
                      key={p}
                      className="bg-[#1a1e25] border border-[#232830] text-[#a3a8b3] text-[11px] px-2 py-0.5 rounded"
                    >
                      {info?.icon} {info?.label}
                    </span>
                  );
                })}
              </div>
            )}
            {profile.bio && (
              <p className="text-[13px] text-[#cdd1d8] whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 space-y-4">
            {/* S15 manual */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">
                S15 최고 티어 (fow에 없으면 직접 입력)
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
                        t === "MASTER" || t === "GRANDMASTER" || t === "CHALLENGER"
                          ? ""
                          : editForm.peakRankS15,
                    });
                  }}
                  className={`flex-1 ${inputCls}`}
                >
                  <option value="">기록 없음</option>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{TIER_LABELS[t]}</option>
                  ))}
                </select>
                {editForm.peakTierS15 &&
                  !["MASTER", "GRANDMASTER", "CHALLENGER"].includes(editForm.peakTierS15) && (
                    <select
                      value={editForm.peakRankS15}
                      onChange={(e) => setEditForm({ ...editForm, peakRankS15: e.target.value })}
                      className={`w-20 ${inputCls}`}
                    >
                      <option value="">단계</option>
                      {DIVISIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
              </div>
              <input
                type="number"
                min={0}
                value={editForm.gamesS15}
                onChange={(e) => setEditForm({ ...editForm, gamesS15: e.target.value })}
                placeholder="S15 판수"
                className={`w-32 mt-2 ${inputCls}`}
              />
            </div>

            {/* Positions */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1.5">
                선호 포지션
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS.map((pos) => {
                  const active = editForm.preferredPositions.includes(pos.value);
                  return (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          preferredPositions: active
                            ? prev.preferredPositions.filter((p) => p !== pos.value)
                            : [...prev.preferredPositions, pos.value],
                        }))
                      }
                      className={`px-2.5 py-1 rounded text-[12px] border transition ${
                        active
                          ? "bg-[#e08a3c] text-black border-[#e08a3c] font-semibold"
                          : "bg-[#0b0d11] text-[#a3a8b3] border-[#232830] hover:border-[#3a414c]"
                      }`}
                    >
                      {pos.icon} {pos.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">소개</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                maxLength={200}
                className={`w-full resize-none ${inputCls}`}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              className="bg-[#e08a3c] hover:bg-[#f09a48] text-black px-4 py-2 rounded text-[13px] font-semibold transition"
            >
              저장
            </button>
          </div>
        )}
      </section>

      {/* Contacts */}
      <ContactList title="받은 컨택" items={received} mode="received" onAction={handleContactAction} />
      <ContactList title="보낸 컨택" items={sent} mode="sent" />
    </div>
  );
}

function ContactList({
  title,
  items,
  mode,
  onAction,
}: {
  title: string;
  items: ContactRequestData[];
  mode: "received" | "sent";
  onAction?: (id: string, action: string) => void;
}) {
  return (
    <section className="bg-[#14171d] border border-[#232830] rounded-md">
      <div className="px-4 py-2.5 border-b border-[#232830] flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-white">{title}</h2>
        <span className="text-[11px] text-[#6c727f] tabular-nums">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-[#6c727f] px-4 py-6 text-center">없음</p>
      ) : (
        <ul className="divide-y divide-[#1a1e25]">
          {items.map((c) => {
            const other = mode === "received" ? c.fromUser : c.toUser;
            return (
              <li key={c.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-[#1a1e25]/40">
                <div className="min-w-0">
                  <p className="text-[13px] text-white">
                    {other.gameName}
                    <span className="text-[#6c727f]">#{other.tagLine}</span>
                  </p>
                  <p className="text-[11px] text-[#6c727f]">
                    {c.type === "fa_contact" ? "FA 컨택" : "팀 참가 신청"}
                    {c.teamPost && ` · ${c.teamPost.title}`}
                  </p>
                </div>
                <div>
                  {c.status === "pending" && mode === "received" && onAction && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onAction(c.id, "accepted")}
                        className="text-[11px] bg-[#2bc66c] hover:opacity-90 text-black font-semibold px-2 py-0.5 rounded"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => onAction(c.id, "rejected")}
                        className="text-[11px] bg-[#1a1e25] hover:bg-[#232830] text-[#a3a8b3] border border-[#232830] px-2 py-0.5 rounded"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {c.status === "pending" && mode === "sent" && (
                    <span className="text-[11px] text-[#e6b73f]">● 대기 중</span>
                  )}
                  {c.status === "accepted" && (
                    <Link
                      href={`/chat/${c.id}`}
                      className="text-[11px] bg-[#e08a3c] hover:bg-[#f09a48] text-black font-semibold px-2 py-0.5 rounded"
                    >
                      채팅
                    </Link>
                  )}
                  {c.status === "rejected" && (
                    <span className="text-[11px] text-[#6c727f]">거절됨</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
