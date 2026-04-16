"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TeamCard from "@/components/TeamCard";
import type { TeamPostData } from "@/lib/types";
import { POSITIONS } from "@/lib/tierScore";

export default function RecruitPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<TeamPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    positions: [] as string[],
    minTier: "",
    maxTier: "",
  });

  useEffect(() => {
    fetch("/api/recruit")
      .then((res) => res.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const togglePosition = (pos: string) => {
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.includes(pos)
        ? prev.positions.filter((p) => p !== pos)
        : [...prev.positions, pos],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/recruit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const refreshed = await fetch("/api/recruit").then((r) => r.json());
      setPosts(refreshed);
      setShowForm(false);
      setForm({ title: "", description: "", positions: [], minTier: "", maxTier: "" });
    } else {
      const data = await res.json();
      alert(data.error || "오류가 발생했습니다.");
    }
  };

  const handleApply = async (postId: string, toUserId: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, teamPostId: postId, type: "team_apply" }),
    });
    const data = await res.json();
    if (res.ok) alert("참가 신청이 완료되었습니다.");
    else alert(data.error || "오류가 발생했습니다.");
  };

  const inputCls =
    "bg-[#0b0d11] border border-[#232830] rounded px-3 py-2 text-[13px] text-white focus:border-[#e08a3c] focus:outline-none";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">
            RECRUIT
          </p>
          <h1 className="text-[20px] font-bold text-white">팀 모집</h1>
        </div>
        {session?.user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-[13px] px-3 py-1.5 rounded font-semibold transition"
          >
            {showForm ? "닫기" : "+ 글쓰기"}
          </button>
        )}
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#14171d] border border-[#232830] rounded-md p-4 mb-5 space-y-3"
        >
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목"
            required
            className={`w-full ${inputCls}`}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="팀 소개, 모집 조건 등을 작성해주세요"
            required
            rows={4}
            className={`w-full resize-none ${inputCls}`}
          />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6c727f] mb-1.5">
              모집 포지션
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => togglePosition(pos.value)}
                  className={`px-2.5 py-1 rounded text-[12px] transition border ${
                    form.positions.includes(pos.value)
                      ? "bg-[#e08a3c] text-black border-[#e08a3c] font-semibold"
                      : "bg-[#0b0d11] text-[#a3a8b3] border-[#232830] hover:border-[#3a414c]"
                  }`}
                >
                  {pos.icon} {pos.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="bg-[#e08a3c] hover:bg-[#f09a48] text-black text-[13px] px-4 py-2 rounded font-semibold transition"
          >
            등록
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#6c727f] text-sm">불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[#6c727f] text-sm">
          아직 모집글이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map((post) => (
            <TeamCard
              key={post.id}
              post={post}
              currentUserId={session?.user?.id}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
