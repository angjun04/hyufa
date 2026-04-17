"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatTier } from "@/lib/tierScore";

interface AdminSettings {
  s16Deadline: string | null;
  s16Locked: boolean;
}

interface AdminUser {
  id: string;
  username: string;
  gameName: string;
  tagLine: string;
  phoneNumber: string;
  currentTier: string | null;
  currentRank: string | null;
  peakTierS16: string | null;
  peakRankS16: string | null;
  peakLockedAt: string | null;
  peakTierS15: string | null;
  peakRankS15: string | null;
  refreshedAt: string | null;
  createdAt: string;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [forbidden, setForbidden] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [deadlineInput, setDeadlineInput] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([
      fetch("/api/admin/settings").then((r) => r),
      fetch("/api/admin/users").then((r) => r),
    ]).then(async ([sRes, uRes]) => {
      if (sRes.status === 404) {
        setForbidden(true);
        return;
      }
      if (sRes.ok) {
        const s = (await sRes.json()) as AdminSettings;
        setSettings(s);
        setDeadlineInput(toLocalInputValue(s.s16Deadline));
      }
      if (uRes.ok) {
        setUsers(await uRes.json());
      }
    });
  }, [session]);

  const saveDeadline = async () => {
    setSavingSettings(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s16Deadline: deadlineInput
          ? new Date(deadlineInput).toISOString()
          : null,
      }),
    });
    if (res.ok) {
      setMessage("마감일이 저장되었습니다.");
    } else {
      const err = await res.json();
      setMessage(`오류: ${err.error}`);
    }
    setSavingSettings(false);
  };

  const toggleLock = async (action: "lock" | "unlock") => {
    if (
      action === "lock" &&
      !confirm("모든 사용자의 S16 최고 티어를 현재 시점으로 확정합니다. 진행할까요?")
    )
      return;
    if (action === "unlock" && !confirm("S16 락을 해제합니다. 진행할까요?"))
      return;

    setLockBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/lock-s16", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessage(
        action === "lock"
          ? `${data.userCount}명의 S16 peak가 확정되었습니다.`
          : "락이 해제되었습니다."
      );
      setSettings((prev) => (prev ? { ...prev, s16Locked: data.locked } : prev));
      // 유저 목록 새로고침
      const uRes = await fetch("/api/admin/users");
      if (uRes.ok) setUsers(await uRes.json());
    } else {
      const err = await res.json();
      setMessage(`오류: ${err.error}`);
    }
    setLockBusy(false);
  };

  if (status === "loading") {
    return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  }
  if (forbidden) {
    return (
      <div className="text-center py-20 text-gray-500">
        접근 권한이 없습니다.
      </div>
    );
  }
  if (!settings) {
    return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">어드민</h1>

      {/* 대회 관리 바로가기 */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">대회 관리</h2>
          <p className="text-xs text-gray-400">팀/대진표/세트별 픽밴 입력</p>
        </div>
        <Link
          href="/admin/tournaments"
          className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold px-3 py-1.5 rounded"
        >
          대회 페이지 →
        </Link>
      </div>

      {message && (
        <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 text-sm p-3 rounded-lg">
          {message}
        </div>
      )}

      {/* Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">S16 시즌 설정</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            신청 마감일 (이 시각 이후의 티어 변동은 점수에 반영되지 않게 락 걸기)
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={saveDeadline}
              disabled={savingSettings}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
            >
              {savingSettings ? "저장 중..." : "저장"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            저장만으로는 락이 걸리지 않습니다. 마감일이 되면 아래 &lsquo;S16
            peak 확정&rsquo; 버튼을 눌러야 모든 사용자의 peak가 고정됩니다.
          </p>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-300 mb-2">
            현재 상태:{" "}
            <span
              className={
                settings.s16Locked ? "text-yellow-400" : "text-green-400"
              }
            >
              {settings.s16Locked ? "🔒 LOCKED" : "🔓 진행 중"}
            </span>
          </p>
          {settings.s16Locked ? (
            <button
              onClick={() => toggleLock("unlock")}
              disabled={lockBusy}
              className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
            >
              {lockBusy ? "처리 중..." : "락 해제"}
            </button>
          ) : (
            <button
              onClick={() => toggleLock("lock")}
              disabled={lockBusy}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
            >
              {lockBusy ? "처리 중..." : "S16 peak 확정"}
            </button>
          )}
        </div>
      </div>

      {/* Users */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          사용자 목록 ({users.length}명, 최대 200명 표시)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-2 px-2">아이디</th>
                <th className="text-left py-2 px-2">라이엇 ID</th>
                <th className="text-left py-2 px-2">현재</th>
                <th className="text-left py-2 px-2">S16 peak</th>
                <th className="text-left py-2 px-2">S15 peak</th>
                <th className="text-left py-2 px-2">갱신</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="py-2 px-2">{u.username}</td>
                  <td className="py-2 px-2 text-gray-400">
                    {u.gameName}#{u.tagLine}
                  </td>
                  <td className="py-2 px-2">
                    {formatTier(u.currentTier, u.currentRank)}
                  </td>
                  <td className="py-2 px-2">
                    {formatTier(u.peakTierS16, u.peakRankS16)}
                    {u.peakLockedAt && (
                      <span className="ml-1 text-xs text-yellow-400">🔒</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {formatTier(u.peakTierS15, u.peakRankS15)}
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-500">
                    {u.refreshedAt
                      ? new Date(u.refreshedAt).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
