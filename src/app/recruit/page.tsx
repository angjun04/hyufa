"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TeamCard from "@/components/TeamCard";
import type { TeamPostData } from "@/lib/types";
import { POSITIONS, TIERS, DIVISIONS, TIER_LABELS } from "@/lib/tierScore";

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
      const newPost = await res.json();
      // Reload to get full post with user data
      const refreshed = await fetch("/api/recruit").then((r) => r.json());
      setPosts(refreshed);
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        positions: [],
        minTier: "",
        maxTier: "",
      });
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
      body: JSON.stringify({
        toUserId,
        teamPostId: postId,
        type: "team_apply",
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("참가 신청이 완료되었습니다!");
    } else {
      alert(data.error || "오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            📋 소환사 모집
          </h1>
          <p className="text-gray-400">팀원을 모집하고 있는 팀들입니다.</p>
        </div>
        {session?.user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {showForm ? "닫기" : "+ 모집글 작성"}
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-8 space-y-4"
        >
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="모집글 제목"
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="팀 소개, 모집 조건 등을 작성해주세요"
            required
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-yellow-500 focus:outline-none resize-none"
          />

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              모집 포지션
            </label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => togglePosition(pos.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    form.positions.includes(pos.value)
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {pos.icon} {pos.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            모집글 등록
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          아직 모집글이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
