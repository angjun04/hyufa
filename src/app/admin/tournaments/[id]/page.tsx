"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SUPERADMIN_ID } from "@/lib/adminConst";
import { POSITIONS } from "@/lib/tournament";

interface Member {
  id: string;
  userId: string | null;
  gameName: string;
  tagLine: string;
  puuid: string | null;
  position: string | null;
  role: string | null;
  isCaptain: boolean;
}
interface Team {
  id: string;
  name: string;
  tag: string | null;
  logoUrl: string | null;
  description: string | null;
  seed: number | null;
  members: Member[];
}
interface MatchItem {
  id: string;
  round: string;
  roundOrder: number;
  matchOrder: number;
  teamA: { id: string; name: string; tag: string | null } | null;
  teamB: { id: string; name: string; tag: string | null } | null;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  winnerTeam: { id: string; name: string } | null;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  scheduledAt: string | null;
  vodUrl: string | null;
  note: string | null;
  _count: { games: number };
}
interface Tournament {
  id: string;
  slug: string;
  name: string;
  season: string | null;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  teams: Team[];
  matches: MatchItem[];
}

const STATUSES = [
  { value: "draft", label: "초안" },
  { value: "upcoming", label: "예정" },
  { value: "ongoing", label: "진행 중" },
  { value: "completed", label: "종료" },
];

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toDateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [t, setT] = useState<Tournament | null>(null);
  const [msg, setMsg] = useState("");
  const isSuperAdmin = session?.user?.id === SUPERADMIN_ID;
  const forbidden = !!session?.user && !isSuperAdmin;

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/tournaments/${id}`);
    if (r.ok) setT(await r.json());
  }, [id]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch(`/api/admin/tournaments/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setT(data);
      });
  }, [isSuperAdmin, id]);

  if (status === "loading")
    return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  if (forbidden)
    return <div className="text-center py-20 text-gray-500">접근 권한이 없습니다.</div>;
  if (!t) return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/admin/tournaments" className="text-xs text-[#6c727f] hover:text-white">
          ← 대회 목록
        </Link>
        <h1 className="text-2xl font-bold text-white mt-1">{t.name}</h1>
        <p className="text-xs text-gray-500">/{t.slug}</p>
      </div>

      {msg && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs p-2 rounded">
          {msg}
        </div>
      )}

      <TournamentInfoSection t={t} reload={load} onMsg={setMsg} />
      <TeamsSection t={t} reload={load} onMsg={setMsg} />
      <MatchesSection t={t} reload={load} onMsg={setMsg} />
    </div>
  );
}

function TournamentInfoSection({
  t,
  reload,
  onMsg,
}: {
  t: Tournament;
  reload: () => Promise<void>;
  onMsg: (s: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: t.name,
    slug: t.slug,
    season: t.season ?? "",
    description: t.description ?? "",
    status: t.status,
    startDate: toDateInput(t.startDate),
    endDate: toDateInput(t.endDate),
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/tournaments/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        season: form.season || null,
        description: form.description || null,
        status: form.status,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      }),
    });
    if (res.ok) {
      onMsg("저장됨");
      setEditing(false);
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`오류: ${e.error}`);
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm("대회를 삭제하면 팀/매치/세트 기록이 모두 사라집니다. 진행할까요?")) return;
    const res = await fetch(`/api/admin/tournaments/${t.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/tournaments");
    else onMsg("삭제 실패");
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">대회 정보</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
          >
            {editing ? "취소" : "수정"}
          </button>
          <button
            onClick={remove}
            className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/40 px-2 py-1 rounded"
          >
            삭제
          </button>
        </div>
      </div>
      {editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="이름"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="slug"
          />
          <input
            value={form.season}
            onChange={(e) => setForm({ ...form, season: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="시즌"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="md:col-span-2 bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            rows={2}
            placeholder="설명"
          />
          <button
            onClick={save}
            disabled={saving}
            className="md:col-span-2 bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black text-sm font-semibold px-3 py-1.5 rounded"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-300 space-y-1">
          <div>
            <span className="text-gray-500">상태:</span>{" "}
            {STATUSES.find((s) => s.value === t.status)?.label ?? t.status}
          </div>
          {t.season && (
            <div>
              <span className="text-gray-500">시즌:</span> {t.season}
            </div>
          )}
          {(t.startDate || t.endDate) && (
            <div>
              <span className="text-gray-500">기간:</span>{" "}
              {t.startDate ? new Date(t.startDate).toLocaleDateString("ko-KR") : "-"}
              {t.endDate ? ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR")}` : ""}
            </div>
          )}
          {t.description && <div className="text-gray-400">{t.description}</div>}
        </div>
      )}
    </div>
  );
}

function TeamsSection({
  t,
  reload,
  onMsg,
}: {
  t: Tournament;
  reload: () => Promise<void>;
  onMsg: (s: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", tag: "", seed: "", description: "" });

  const addTeam = async () => {
    const res = await fetch(`/api/admin/tournaments/${t.id}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", tag: "", seed: "", description: "" });
      setAdding(false);
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`팀 추가 실패: ${e.error}`);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">팀 ({t.teams.length})</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-xs bg-[#e08a3c] hover:bg-[#f09a48] text-black font-semibold px-2 py-1 rounded"
        >
          {adding ? "취소" : "+ 팀 추가"}
        </button>
      </div>
      {adding && (
        <div className="mb-3 p-3 bg-gray-900/50 rounded border border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="md:col-span-2 bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="팀 이름 *"
          />
          <input
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="태그 (선택)"
          />
          <input
            value={form.seed}
            onChange={(e) => setForm({ ...form, seed: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="시드 (숫자)"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="md:col-span-3 bg-gray-700 rounded px-2 py-1.5 text-sm text-white"
            placeholder="설명 (선택)"
          />
          <button
            onClick={addTeam}
            className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold px-3 py-1.5 rounded"
          >
            추가
          </button>
        </div>
      )}
      <div className="space-y-2">
        {t.teams.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">팀이 없습니다.</div>
        )}
        {t.teams.map((team) => (
          <TeamRow key={team.id} team={team} reload={reload} onMsg={onMsg} />
        ))}
      </div>
    </div>
  );
}

function TeamRow({
  team,
  reload,
  onMsg,
}: {
  team: Team;
  reload: () => Promise<void>;
  onMsg: (s: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: team.name,
    tag: team.tag ?? "",
    seed: team.seed?.toString() ?? "",
    description: team.description ?? "",
  });
  const [memberForm, setMemberForm] = useState({
    gameName: "",
    tagLine: "",
    position: "",
    role: "",
    isCaptain: false,
  });

  const save = async () => {
    const res = await fetch(`/api/admin/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditing(false);
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`팀 수정 실패: ${e.error}`);
    }
  };
  const remove = async () => {
    if (!confirm(`팀 "${team.name}"을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/teams/${team.id}`, { method: "DELETE" });
    if (res.ok) await reload();
    else onMsg("팀 삭제 실패");
  };
  const addMember = async () => {
    if (!memberForm.gameName || !memberForm.tagLine) {
      onMsg("닉네임/태그를 입력하세요.");
      return;
    }
    const res = await fetch(`/api/admin/teams/${team.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberForm),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.warning) onMsg(data.warning);
      setMemberForm({ gameName: "", tagLine: "", position: "", role: "", isCaptain: false });
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`팀원 추가 실패: ${e.error}`);
    }
  };
  const removeMember = async (mid: string, name: string) => {
    if (!confirm(`팀원 ${name} 삭제?`)) return;
    const res = await fetch(`/api/admin/members/${mid}`, { method: "DELETE" });
    if (res.ok) await reload();
    else onMsg("팀원 삭제 실패");
  };
  const toggleCaptain = async (m: Member) => {
    const res = await fetch(`/api/admin/members/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCaptain: !m.isCaptain }),
    });
    if (res.ok) await reload();
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left flex items-center gap-2"
        >
          <span className="text-gray-400 text-xs w-6">{expanded ? "▼" : "▶"}</span>
          <span className="text-white text-sm font-semibold">{team.name}</span>
          {team.tag && (
            <span className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
              {team.tag}
            </span>
          )}
          {team.seed != null && (
            <span className="text-xs text-gray-500">시드 #{team.seed}</span>
          )}
          <span className="text-xs text-gray-500 ml-2">({team.members.length}명)</span>
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded"
          >
            {editing ? "취소" : "편집"}
          </button>
          <button
            onClick={remove}
            className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/40 px-2 py-0.5 rounded"
          >
            삭제
          </button>
        </div>
      </div>
      {editing && (
        <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="md:col-span-2 bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
          <input
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="태그"
          />
          <input
            value={form.seed}
            onChange={(e) => setForm({ ...form, seed: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="시드"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="md:col-span-3 bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="설명"
          />
          <button
            onClick={save}
            className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold rounded"
          >
            저장
          </button>
        </div>
      )}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-700 pt-2">
          {team.members.length === 0 ? (
            <div className="text-xs text-gray-500">팀원 없음</div>
          ) : (
            <div className="space-y-1">
              {team.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-sm bg-gray-900/50 rounded px-2 py-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleCaptain(m)}
                      title="주장 토글"
                      className={m.isCaptain ? "text-[#e6b73f]" : "text-gray-600 hover:text-gray-400"}
                    >
                      ★
                    </button>
                    <span className="text-white">
                      {m.gameName}
                      <span className="text-gray-500 text-xs">#{m.tagLine}</span>
                    </span>
                    {m.position && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                        {m.position}
                      </span>
                    )}
                    {m.role && <span className="text-xs text-gray-500">{m.role}</span>}
                    {!m.puuid && (
                      <span className="text-xs text-red-400" title="라이엇 조회 실패 — 정보 표시 불가">
                        ⚠ PUUID 없음
                      </span>
                    )}
                    {m.userId && (
                      <span className="text-xs text-green-400" title="회원 계정 연결됨">
                        회원
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeMember(m.id, `${m.gameName}#${m.tagLine}`)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-gray-700 grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
            <input
              value={memberForm.gameName}
              onChange={(e) => setMemberForm({ ...memberForm, gameName: e.target.value })}
              className="md:col-span-2 bg-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="라이엇 닉네임"
            />
            <input
              value={memberForm.tagLine}
              onChange={(e) => setMemberForm({ ...memberForm, tagLine: e.target.value })}
              className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="태그 (KR1)"
            />
            <select
              value={memberForm.position}
              onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
              className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value="">포지션</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              value={memberForm.role}
              onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
              className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="역할 (MAIN/SUB)"
            />
            <button
              onClick={addMember}
              className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold px-2 py-1 rounded"
            >
              + 추가
            </button>
          </div>
          <label className="text-xs text-gray-400 flex items-center gap-1">
            <input
              type="checkbox"
              checked={memberForm.isCaptain}
              onChange={(e) => setMemberForm({ ...memberForm, isCaptain: e.target.checked })}
            />
            주장으로 등록
          </label>
        </div>
      )}
    </div>
  );
}

function MatchesSection({
  t,
  reload,
  onMsg,
}: {
  t: Tournament;
  reload: () => Promise<void>;
  onMsg: (s: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    round: "16강",
    roundOrder: "1",
    matchOrder: "1",
    teamAId: "",
    teamBId: "",
    bestOf: "1",
    scheduledAt: "",
    vodUrl: "",
  });

  const addMatch = async () => {
    if (!form.round) {
      onMsg("라운드 이름을 입력하세요.");
      return;
    }
    const res = await fetch(`/api/admin/tournaments/${t.id}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round: form.round,
        roundOrder: parseInt(form.roundOrder, 10),
        matchOrder: parseInt(form.matchOrder, 10),
        teamAId: form.teamAId || null,
        teamBId: form.teamBId || null,
        bestOf: parseInt(form.bestOf, 10),
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        vodUrl: form.vodUrl || null,
      }),
    });
    if (res.ok) {
      setForm({ ...form, teamAId: "", teamBId: "", vodUrl: "" });
      setAdding(false);
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`매치 추가 실패: ${e.error}`);
    }
  };

  // 라운드별 그룹핑
  const grouped: Record<string, MatchItem[]> = {};
  for (const m of t.matches) {
    const key = `${m.roundOrder}::${m.round}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [ao] = a.split("::");
    const [bo] = b.split("::");
    return parseInt(ao, 10) - parseInt(bo, 10);
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">대진표 ({t.matches.length})</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-xs bg-[#e08a3c] hover:bg-[#f09a48] text-black font-semibold px-2 py-1 rounded"
        >
          {adding ? "취소" : "+ 매치 추가"}
        </button>
      </div>
      {adding && (
        <div className="mb-3 p-3 bg-gray-900/50 rounded border border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={form.round}
            onChange={(e) => setForm({ ...form, round: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="라운드 이름 (예: 16강)"
          />
          <input
            type="number"
            value={form.roundOrder}
            onChange={(e) => setForm({ ...form, roundOrder: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="라운드 순서"
          />
          <input
            type="number"
            value={form.matchOrder}
            onChange={(e) => setForm({ ...form, matchOrder: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="라운드 내 순서"
          />
          <select
            value={form.bestOf}
            onChange={(e) => setForm({ ...form, bestOf: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="1">Bo1</option>
            <option value="3">Bo3</option>
            <option value="5">Bo5</option>
          </select>
          <select
            value={form.teamAId}
            onChange={(e) => setForm({ ...form, teamAId: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">팀 A 미정</option>
            {t.teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
          <select
            value={form.teamBId}
            onChange={(e) => setForm({ ...form, teamBId: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">팀 B 미정</option>
            {t.teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
          <input
            value={form.vodUrl}
            onChange={(e) => setForm({ ...form, vodUrl: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="VOD URL (선택)"
          />
          <button
            onClick={addMatch}
            className="md:col-span-4 bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold px-3 py-1.5 rounded"
          >
            매치 추가
          </button>
        </div>
      )}
      <div className="space-y-4">
        {sortedKeys.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">매치가 없습니다.</div>
        )}
        {sortedKeys.map((k) => {
          const [, roundName] = k.split("::");
          return (
            <div key={k}>
              <h3 className="text-xs text-[#e08a3c] font-bold mb-2">{roundName}</h3>
              <div className="space-y-1">
                {grouped[k].map((m) => (
                  <MatchRow
                    key={m.id}
                    m={m}
                    tournamentId={t.id}
                    teams={t.teams}
                    reload={reload}
                    onMsg={onMsg}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchRow({
  m,
  tournamentId,
  teams,
  reload,
  onMsg,
}: {
  m: MatchItem;
  tournamentId: string;
  teams: Team[];
  reload: () => Promise<void>;
  onMsg: (s: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    round: m.round,
    roundOrder: String(m.roundOrder),
    matchOrder: String(m.matchOrder),
    teamAId: m.teamAId ?? "",
    teamBId: m.teamBId ?? "",
    winnerTeamId: m.winnerTeamId ?? "",
    bestOf: String(m.bestOf),
    scoreA: String(m.scoreA),
    scoreB: String(m.scoreB),
    scheduledAt: toDateTimeInput(m.scheduledAt),
    vodUrl: m.vodUrl ?? "",
    note: m.note ?? "",
  });

  const save = async () => {
    const res = await fetch(`/api/admin/matches/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round: form.round,
        roundOrder: parseInt(form.roundOrder, 10),
        matchOrder: parseInt(form.matchOrder, 10),
        teamAId: form.teamAId || null,
        teamBId: form.teamBId || null,
        winnerTeamId: form.winnerTeamId || null,
        bestOf: parseInt(form.bestOf, 10),
        scoreA: parseInt(form.scoreA, 10) || 0,
        scoreB: parseInt(form.scoreB, 10) || 0,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        vodUrl: form.vodUrl || null,
        note: form.note || null,
      }),
    });
    if (res.ok) {
      setEditing(false);
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`매치 수정 실패: ${e.error}`);
    }
  };
  const remove = async () => {
    if (!confirm("매치와 세트 기록을 모두 삭제할까요?")) return;
    const res = await fetch(`/api/admin/matches/${m.id}`, { method: "DELETE" });
    if (res.ok) await reload();
    else onMsg("매치 삭제 실패");
  };

  const teamAName = m.teamA?.name ?? "TBD";
  const teamBName = m.teamB?.name ?? "TBD";

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded p-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs text-gray-500">#{m.matchOrder}</span>
          <span
            className={m.winnerTeamId === m.teamAId ? "text-[#e6b73f] font-bold" : "text-gray-200"}
          >
            {teamAName}
          </span>
          <span className="text-gray-500 text-xs">
            {m.scoreA} vs {m.scoreB}
          </span>
          <span
            className={m.winnerTeamId === m.teamBId ? "text-[#e6b73f] font-bold" : "text-gray-200"}
          >
            {teamBName}
          </span>
          <span className="text-xs text-gray-500">Bo{m.bestOf}</span>
          {m.scheduledAt && (
            <span className="text-xs text-gray-500">
              · {new Date(m.scheduledAt).toLocaleString("ko-KR")}
            </span>
          )}
          {m.vodUrl && (
            <a
              href={m.vodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#e08a3c] hover:underline"
            >
              VOD
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <Link
            href={`/admin/tournaments/${tournamentId}/matches/${m.id}`}
            className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-600/40 px-2 py-0.5 rounded"
          >
            세트/픽밴 ({m._count.games})
          </Link>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded"
          >
            {editing ? "취소" : "편집"}
          </button>
          <button
            onClick={remove}
            className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/40 px-2 py-0.5 rounded"
          >
            삭제
          </button>
        </div>
      </div>
      {editing && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={form.round}
            onChange={(e) => setForm({ ...form, round: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="라운드"
          />
          <input
            type="number"
            value={form.roundOrder}
            onChange={(e) => setForm({ ...form, roundOrder: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="라운드순서"
          />
          <input
            type="number"
            value={form.matchOrder}
            onChange={(e) => setForm({ ...form, matchOrder: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="내부순서"
          />
          <select
            value={form.bestOf}
            onChange={(e) => setForm({ ...form, bestOf: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="1">Bo1</option>
            <option value="3">Bo3</option>
            <option value="5">Bo5</option>
          </select>
          <select
            value={form.teamAId}
            onChange={(e) => setForm({ ...form, teamAId: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">팀 A 미정</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
          <select
            value={form.teamBId}
            onChange={(e) => setForm({ ...form, teamBId: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">팀 B 미정</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.scoreA}
            onChange={(e) => setForm({ ...form, scoreA: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="스코어 A"
          />
          <input
            type="number"
            value={form.scoreB}
            onChange={(e) => setForm({ ...form, scoreB: e.target.value })}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="스코어 B"
          />
          <select
            value={form.winnerTeamId}
            onChange={(e) => setForm({ ...form, winnerTeamId: e.target.value })}
            className="md:col-span-2 bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">승자 미정</option>
            {form.teamAId && (
              <option value={form.teamAId}>
                {teams.find((tm) => tm.id === form.teamAId)?.name ?? "팀 A"} 승
              </option>
            )}
            {form.teamBId && (
              <option value={form.teamBId}>
                {teams.find((tm) => tm.id === form.teamBId)?.name ?? "팀 B"} 승
              </option>
            )}
          </select>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="md:col-span-2 bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
          <input
            value={form.vodUrl}
            onChange={(e) => setForm({ ...form, vodUrl: e.target.value })}
            className="md:col-span-4 bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="VOD URL"
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="md:col-span-4 bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="메모"
          />
          <button
            onClick={save}
            className="md:col-span-4 bg-[#e08a3c] hover:bg-[#f09a48] text-black text-sm font-semibold rounded py-1.5"
          >
            저장
          </button>
        </div>
      )}
    </div>
  );
}
