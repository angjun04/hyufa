"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SUPERADMIN_ID } from "@/lib/adminConst";
import { POSITIONS, type PickEntry } from "@/lib/tournament";

interface TeamMini {
  id: string;
  name: string;
  tag: string | null;
  members: Array<{
    id: string;
    gameName: string;
    tagLine: string;
    position: string | null;
  }>;
}
interface GameItem {
  id: string;
  gameNumber: number;
  blueTeamId: string | null;
  redTeamId: string | null;
  winnerSide: "blue" | "red" | null;
  blueBans: string[];
  redBans: string[];
  bluePicks: PickEntry[] | null;
  redPicks: PickEntry[] | null;
  durationSec: number | null;
  note: string | null;
}
interface MatchDetail {
  id: string;
  round: string;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  tournament: { id: string; name: string; slug: string };
  teamA: TeamMini | null;
  teamB: TeamMini | null;
  games: GameItem[];
}

export default function AdminMatchEditorPage() {
  const params = useParams<{ id: string; matchId: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [m, setM] = useState<MatchDetail | null>(null);
  const [msg, setMsg] = useState("");
  const isSuperAdmin = session?.user?.id === SUPERADMIN_ID;
  const forbidden = !!session?.user && !isSuperAdmin;

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/matches/${params.matchId}`);
    if (r.ok) setM(await r.json());
  }, [params.matchId]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch(`/api/admin/matches/${params.matchId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setM(data);
      });
  }, [isSuperAdmin, params.matchId]);

  const addGame = async () => {
    const nextNum = m ? (m.games[m.games.length - 1]?.gameNumber ?? 0) + 1 : 1;
    const res = await fetch(`/api/admin/matches/${params.matchId}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameNumber: nextNum,
        blueTeamId: m?.teamA?.id ?? null,
        redTeamId: m?.teamB?.id ?? null,
      }),
    });
    if (res.ok) await load();
    else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      setMsg(`세트 추가 실패: ${e.error}`);
    }
  };

  if (status === "loading")
    return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;
  if (forbidden)
    return <div className="text-center py-20 text-gray-500">접근 권한이 없습니다.</div>;
  if (!m) return <div className="text-center py-20 text-gray-500">불러오는 중...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link
          href={`/admin/tournaments/${m.tournament.id}`}
          className="text-xs text-[#6c727f] hover:text-white"
        >
          ← {m.tournament.name}
        </Link>
        <h1 className="text-2xl font-bold text-white mt-1">
          {m.round} · {m.teamA?.name ?? "TBD"} vs {m.teamB?.name ?? "TBD"}
        </h1>
        <p className="text-sm text-gray-400">
          Bo{m.bestOf} · 현재 스코어 {m.scoreA} - {m.scoreB}
        </p>
      </div>

      {msg && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs p-2 rounded">
          {msg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-white">세트 ({m.games.length})</h2>
        <button
          onClick={addGame}
          className="text-xs bg-[#e08a3c] hover:bg-[#f09a48] text-black font-semibold px-3 py-1 rounded"
        >
          + 세트 추가
        </button>
      </div>

      <div className="space-y-4">
        {m.games.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-700 rounded">
            세트가 없습니다. &quot;세트 추가&quot; 버튼으로 첫 세트를 만드세요.
          </div>
        )}
        {m.games.map((g) => (
          <GameEditor
            key={g.id}
            g={g}
            teamA={m.teamA}
            teamB={m.teamB}
            reload={load}
            onMsg={setMsg}
          />
        ))}
      </div>
    </div>
  );
}

function GameEditor({
  g,
  teamA,
  teamB,
  reload,
  onMsg,
}: {
  g: GameItem;
  teamA: TeamMini | null;
  teamB: TeamMini | null;
  reload: () => Promise<void>;
  onMsg: (s: string) => void;
}) {
  const [blueTeamId, setBlueTeamId] = useState(g.blueTeamId ?? "");
  const [redTeamId, setRedTeamId] = useState(g.redTeamId ?? "");
  const [winnerSide, setWinnerSide] = useState<"blue" | "red" | "">(g.winnerSide ?? "");
  const [blueBans, setBlueBans] = useState<string[]>(
    [...g.blueBans, "", "", "", "", ""].slice(0, 5)
  );
  const [redBans, setRedBans] = useState<string[]>(
    [...g.redBans, "", "", "", "", ""].slice(0, 5)
  );
  const [bluePicks, setBluePicks] = useState<PickEntry[]>(
    fillPicks(g.bluePicks)
  );
  const [redPicks, setRedPicks] = useState<PickEntry[]>(fillPicks(g.redPicks));
  const [duration, setDuration] = useState(g.durationSec?.toString() ?? "");
  const [note, setNote] = useState(g.note ?? "");
  const [saving, setSaving] = useState(false);

  const teams = [teamA, teamB].filter((x): x is TeamMini => !!x);
  const blueTeam = teams.find((t) => t.id === blueTeamId) ?? null;
  const redTeam = teams.find((t) => t.id === redTeamId) ?? null;

  const save = async () => {
    setSaving(true);
    const cleanedBlueBans = blueBans.map((s) => s.trim()).filter(Boolean);
    const cleanedRedBans = redBans.map((s) => s.trim()).filter(Boolean);
    const cleanedBluePicks = bluePicks.filter((p) => p.champion.trim());
    const cleanedRedPicks = redPicks.filter((p) => p.champion.trim());
    const res = await fetch(`/api/admin/games/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blueTeamId: blueTeamId || null,
        redTeamId: redTeamId || null,
        winnerSide: winnerSide || null,
        blueBans: cleanedBlueBans,
        redBans: cleanedRedBans,
        bluePicks: cleanedBluePicks.length ? cleanedBluePicks : null,
        redPicks: cleanedRedPicks.length ? cleanedRedPicks : null,
        durationSec: duration || null,
        note: note || null,
      }),
    });
    if (res.ok) {
      onMsg(`세트 ${g.gameNumber} 저장됨`);
      await reload();
    } else {
      const e = await res.json().catch(() => ({ error: "오류" }));
      onMsg(`저장 실패: ${e.error}`);
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm(`세트 ${g.gameNumber}을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/games/${g.id}`, { method: "DELETE" });
    if (res.ok) await reload();
    else onMsg("세트 삭제 실패");
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">세트 {g.gameNumber}</h3>
        <button
          onClick={remove}
          className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-600/40 px-2 py-0.5 rounded"
        >
          세트 삭제
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400">블루 팀</label>
          <select
            value={blueTeamId}
            onChange={(e) => setBlueTeamId(e.target.value)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">미정</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">레드 팀</label>
          <select
            value={redTeamId}
            onChange={(e) => setRedTeamId(e.target.value)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">미정</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400">승자</label>
          <select
            value={winnerSide}
            onChange={(e) => setWinnerSide(e.target.value as "blue" | "red" | "")}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="">미정</option>
            <option value="blue">블루 승</option>
            <option value="red">레드 승</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SidePanel
          side="blue"
          bans={blueBans}
          setBans={setBlueBans}
          picks={bluePicks}
          setPicks={setBluePicks}
          team={blueTeam}
        />
        <SidePanel
          side="red"
          bans={redBans}
          setBans={setRedBans}
          picks={redPicks}
          setPicks={setRedPicks}
          team={redTeam}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400">경기 시간 (초)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
            placeholder="예: 1820"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">메모</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black text-sm font-semibold py-2 rounded"
      >
        {saving ? "저장 중..." : `세트 ${g.gameNumber} 저장`}
      </button>
    </div>
  );
}

function SidePanel({
  side,
  bans,
  setBans,
  picks,
  setPicks,
  team,
}: {
  side: "blue" | "red";
  bans: string[];
  setBans: (v: string[]) => void;
  picks: PickEntry[];
  setPicks: (v: PickEntry[]) => void;
  team: TeamMini | null;
}) {
  const color = side === "blue" ? "text-blue-400" : "text-red-400";
  const bgColor = side === "blue" ? "bg-blue-500/5" : "bg-red-500/5";
  const borderColor = side === "blue" ? "border-blue-500/20" : "border-red-500/20";

  const updateBan = (i: number, v: string) => {
    const next = [...bans];
    next[i] = v;
    setBans(next);
  };
  const updatePick = (i: number, patch: Partial<PickEntry>) => {
    const next = picks.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
    setPicks(next);
  };

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3 space-y-2`}>
      <h4 className={`text-xs font-bold ${color}`}>
        {side === "blue" ? "블루 사이드" : "레드 사이드"}
        {team && <span className="text-gray-400 ml-1">· {team.name}</span>}
      </h4>

      <div>
        <div className="text-xs text-gray-400 mb-1">밴 (챔피언명 5개)</div>
        <div className="grid grid-cols-5 gap-1">
          {bans.map((b, i) => (
            <input
              key={i}
              value={b}
              onChange={(e) => updateBan(i, e.target.value)}
              className="bg-gray-700 rounded px-1.5 py-1 text-xs text-white"
              placeholder={`밴${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-1">픽 (포지션별)</div>
        <div className="space-y-1">
          {picks.map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-2 text-xs text-gray-400">{p.position}</div>
              <input
                value={p.champion}
                onChange={(e) => updatePick(i, { champion: e.target.value })}
                className="col-span-4 bg-gray-700 rounded px-1.5 py-1 text-xs text-white"
                placeholder="챔피언"
              />
              <select
                value={p.memberId ?? ""}
                onChange={(e) => {
                  const mid = e.target.value || null;
                  const member = team?.members.find((m) => m.id === mid);
                  updatePick(i, {
                    memberId: mid,
                    displayName: member ? `${member.gameName}#${member.tagLine}` : null,
                  });
                }}
                className="col-span-6 bg-gray-700 rounded px-1.5 py-1 text-xs text-white"
              >
                <option value="">플레이어 선택</option>
                {team?.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.gameName}#{m.tagLine}
                    {m.position ? ` (${m.position})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fillPicks(existing: PickEntry[] | null | undefined): PickEntry[] {
  const byPos = new Map<string, PickEntry>();
  if (existing) {
    for (const p of existing) {
      if (p && POSITIONS.includes(p.position as (typeof POSITIONS)[number])) {
        byPos.set(p.position, p);
      }
    }
  }
  return POSITIONS.map(
    (pos) =>
      byPos.get(pos) ?? {
        position: pos,
        champion: "",
        memberId: null,
        displayName: null,
      }
  );
}
