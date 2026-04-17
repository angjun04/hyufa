"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TournamentSummary {
  id: string;
  slug: string;
  name: string;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { teams: number; matches: number };
}

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  upcoming: "예정",
  ongoing: "진행 중",
  completed: "종료",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "text-gray-400",
  upcoming: "text-blue-400",
  ongoing: "text-[#e6b73f]",
  completed: "text-gray-500",
};

export default function TournamentsPage() {
  const [items, setItems] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">대회</h1>
      {loading ? (
        <div className="text-center py-20 text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          아직 공개된 대회가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.slug}`}
              className="block bg-[#121519] border border-[#232830] hover:border-[#e08a3c]/60 rounded-lg p-4 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-white font-bold">{t.name}</h2>
                <span className={`text-xs ${STATUS_COLOR[t.status] ?? "text-gray-400"}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
              {t.season && <p className="text-xs text-gray-500 mt-0.5">{t.season}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                <span>팀 {t._count.teams}</span>
                <span>매치 {t._count.matches}</span>
                {t.startDate && (
                  <span className="text-gray-500">
                    {new Date(t.startDate).toLocaleDateString("ko-KR")}
                    {t.endDate
                      ? ` ~ ${new Date(t.endDate).toLocaleDateString("ko-KR")}`
                      : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
