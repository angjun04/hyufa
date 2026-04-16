"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PlayerCard from "@/components/PlayerCard";
import type { UserProfile } from "@/lib/types";
import { POSITIONS } from "@/lib/tierScore";

export default function FAMarketPage() {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPos, setFilterPos] = useState<string>("");

  useEffect(() => {
    fetch("/api/fa")
      .then((res) => res.json())
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  const handleContact = async (playerId: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: playerId, type: "fa_contact" }),
    });
    const data = await res.json();
    if (res.ok) alert("컨택 신청이 완료되었습니다.");
    else alert(data.error || "오류가 발생했습니다.");
  };

  const filtered = filterPos
    ? players.filter((p) => p.preferredPositions.includes(filterPos))
    : players;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">
            FREE AGENT
          </p>
          <h1 className="text-[20px] font-bold text-white">FA 마켓</h1>
        </div>
        <span className="text-[12px] text-[#6c727f] tabular-nums">
          {filtered.length}명
        </span>
      </header>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#232830] overflow-x-auto">
        <button
          onClick={() => setFilterPos("")}
          className={`px-3 py-2 text-[12px] font-medium relative whitespace-nowrap ${
            !filterPos ? "text-white" : "text-[#6c727f] hover:text-white"
          }`}
        >
          전체
          {!filterPos && (
            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#e08a3c]" />
          )}
        </button>
        {POSITIONS.map((pos) => (
          <button
            key={pos.value}
            onClick={() => setFilterPos(pos.value)}
            className={`px-3 py-2 text-[12px] font-medium relative whitespace-nowrap ${
              filterPos === pos.value
                ? "text-white"
                : "text-[#6c727f] hover:text-white"
            }`}
          >
            {pos.icon} {pos.label}
            {filterPos === pos.value && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#e08a3c]" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#6c727f] text-sm">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6c727f] text-sm">
          등록된 FA가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              currentUserId={session?.user?.id}
              onContact={handleContact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
