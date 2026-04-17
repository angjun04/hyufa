"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUPERADMIN_ID } from "@/lib/adminConst";

interface TournamentListItem {
  id: string;
  slug: string;
  name: string;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { teams: number; matches: number };
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  upcoming: "예정",
  ongoing: "진행 중",
  completed: "종료",
};

export default function AdminTournamentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<TournamentListItem[] | null>(null);
  const isSuperAdmin = session?.user?.id === SUPERADMIN_ID;
  const forbidden = !!session?.user && !isSuperAdmin;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    season: "",
    description: "",
    status: "draft",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch("/api/admin/tournaments")
      .then(async (r) => (r.ok ? r.json() : []))
      .then((data) => setItems(data));
  }, [isSuperAdmin]);

  const create = async () => {
    setSaving(true);
    setErr("");
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        season: form.season || null,
        description: form.description || null,
        status: form.status,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      router.push(`/admin/tournaments/${created.id}`);
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      setErr(e.error ?? "오류");
      setSaving(false);
    }
  };

  if (status === "loading")
    return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  if (forbidden)
    return <div className="text-center py-20 text-gray-500">접근 권한이 없습니다.</div>;
  if (!items)
    return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-[#6c727f] hover:text-white">
            ← 어드민
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">대회 관리</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold px-3 py-1.5 rounded"
        >
          {showForm ? "취소" : "+ 새 대회"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">새 대회 만들기</h2>
          {err && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">
              {err}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">이름 *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                placeholder="2026 LCMC 봄 시즌"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">slug * (url용 영소문자/숫자/하이픈)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                placeholder="2026-spring"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">시즌 태그</label>
              <input
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                placeholder="S16-봄"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">상태</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="draft">초안</option>
                <option value="upcoming">예정</option>
                <option value="ongoing">진행 중</option>
                <option value="completed">종료</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">종료일</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                rows={3}
              />
            </div>
          </div>
          <button
            onClick={create}
            disabled={saving}
            className="bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black text-sm font-semibold px-4 py-1.5 rounded"
          >
            {saving ? "생성 중..." : "생성"}
          </button>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">대회가 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900/50 text-gray-400">
              <tr>
                <th className="text-left py-2 px-3">이름 / slug</th>
                <th className="text-left py-2 px-3">상태</th>
                <th className="text-left py-2 px-3">팀</th>
                <th className="text-left py-2 px-3">매치</th>
                <th className="text-left py-2 px-3">기간</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-gray-700 hover:bg-gray-900/30 cursor-pointer"
                  onClick={() => router.push(`/admin/tournaments/${t.id}`)}
                >
                  <td className="py-2 px-3">
                    <div className="text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">/{t.slug}</div>
                  </td>
                  <td className="py-2 px-3 text-gray-300">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </td>
                  <td className="py-2 px-3 text-gray-300">{t._count.teams}</td>
                  <td className="py-2 px-3 text-gray-300">{t._count.matches}</td>
                  <td className="py-2 px-3 text-xs text-gray-400">
                    {t.startDate
                      ? new Date(t.startDate).toLocaleDateString("ko-KR")
                      : "-"}
                    {t.endDate
                      ? ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR")}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
