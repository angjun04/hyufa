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
      body: JSON.stringify({
        toUserId: playerId,
        type: "fa_contact",
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("컨택 신청이 완료되었습니다!");
    } else {
      alert(data.error || "오류가 발생했습니다.");
    }
  };

  const filtered = filterPos
    ? players.filter((p) => p.preferredPositions.includes(filterPos))
    : players;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          🎮 FA 마켓
        </h1>
        <p className="text-gray-400">팀을 찾고 있는 소환사들입니다.</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterPos("")}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
            !filterPos
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          전체
        </button>
        {POSITIONS.map((pos) => (
          <button
            key={pos.value}
            onClick={() => setFilterPos(pos.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filterPos === pos.value
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {pos.icon} {pos.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          아직 등록된 FA가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
