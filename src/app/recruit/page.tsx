"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TeamCard from "@/components/TeamCard";
import type { TeamPostData } from "@/lib/types";
import { POSITIONS } from "@/lib/tierScore";

interface MemberInput {
  gameName: string;
  tagLine: string;
}

interface FormState {
  title: string;
  description: string;
  positions: string[];
  minTier: string;
  maxTier: string;
  members: MemberInput[];
}

const emptyForm: FormState = {
  title: "",
  description: "",
  positions: [],
  minTier: "",
  maxTier: "",
  members: [],
};

export default function RecruitPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<TeamPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [memberInput, setMemberInput] = useState("");

  const refresh = async () => {
    const refreshed = await fetch("/api/recruit").then((r) => r.json());
    setPosts(refreshed);
  };

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

  const addMember = () => {
    const raw = memberInput.trim();
    if (!raw) return;
    const [name, tag] = raw.split("#");
    if (!name?.trim() || !tag?.trim()) {
      alert("닉네임#태그 형식으로 입력해주세요. (예: Faker#KR1)");
      return;
    }
    const gameName = name.trim();
    const tagLine = tag.trim();
    const exists = form.members.some(
      (m) =>
        m.gameName.toLowerCase() === gameName.toLowerCase() &&
        m.tagLine.toLowerCase() === tagLine.toLowerCase()
    );
    if (exists) {
      setMemberInput("");
      return;
    }
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, { gameName, tagLine }],
    }));
    setMemberInput("");
  };

  const removeMember = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== idx),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMemberInput("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (post: TeamPostData) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      description: post.description,
      positions: post.positions,
      minTier: post.minTier ?? "",
      maxTier: post.maxTier ?? "",
      members: post.members.map((m) => ({
        gameName: m.gameName,
        tagLine: m.tagLine,
      })),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("모집글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/recruit/${postId}`, { method: "DELETE" });
    if (res.ok) {
      await refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/recruit/${editingId}` : "/api/recruit";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await refresh();
        closeForm();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
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
            onClick={() => {
              if (showForm) closeForm();
              else setShowForm(true);
            }}
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
          {editingId && (
            <p className="text-[11px] text-[#e08a3c]">모집글 수정 중</p>
          )}
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

          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6c727f] mb-1.5">
              현재 팀원 (본인 제외)
            </p>
            {form.members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.members.map((m, idx) => (
                  <div
                    key={`${m.gameName}#${m.tagLine}`}
                    className="flex items-center gap-1.5 bg-[#0b0d11] border border-[#232830] rounded px-2 py-1 text-[12px] text-[#cdd1d8]"
                  >
                    <span>
                      {m.gameName}
                      <span className="text-[#6c727f]">#{m.tagLine}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMember(idx)}
                      className="text-[#6c727f] hover:text-[#c14545] text-[14px] leading-none"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMember();
                  }
                }}
                placeholder="닉네임#KR1"
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="button"
                onClick={addMember}
                className="bg-[#1a1e25] hover:bg-[#232830] border border-[#232830] hover:border-[#e08a3c] text-white text-[12px] px-3 rounded font-medium transition"
              >
                추가
              </button>
            </div>
            <p className="text-[10px] text-[#6c727f] mt-1">
              등록 시 존재하지 않는 계정은 자동으로 제외됩니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black text-[13px] px-4 py-2 rounded font-semibold transition"
            >
              {submitting ? "저장 중..." : editingId ? "수정 완료" : "등록"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={closeForm}
                className="bg-[#1a1e25] hover:bg-[#232830] border border-[#232830] text-[#a3a8b3] text-[13px] px-4 py-2 rounded font-medium transition"
              >
                취소
              </button>
            )}
          </div>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
