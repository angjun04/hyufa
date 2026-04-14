"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TIERS, DIVISIONS, TIER_LABELS, POSITIONS } from "@/lib/tierScore";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    gameName: "",
    tagLine: "",
    peakTierS15: "",
    peakRankS15: "",
    preferredPositions: [] as string[],
    bio: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isHighTier = (tier: string) =>
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER";

  const togglePosition = (pos: string) => {
    setForm((prev) => ({
      ...prev,
      preferredPositions: prev.preferredPositions.includes(pos)
        ? prev.preferredPositions.filter((p) => p !== pos)
        : [...prev.preferredPositions, pos],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          gameName: form.gameName,
          tagLine: form.tagLine,
          peakTierS15: form.peakTierS15 || null,
          peakRankS15: isHighTier(form.peakTierS15)
            ? "I"
            : form.peakRankS15 || null,
          preferredPositions: form.preferredPositions,
          bio: form.bio || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-center mb-8">회원가입</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Email / Password */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              placeholder="email@hanyang.ac.kr"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              placeholder="6자 이상"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(e) =>
                setForm({ ...form, passwordConfirm: e.target.value })
              }
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Riot ID */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            라이엇 ID (현재 티어 자동 조회)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.gameName}
              onChange={(e) => setForm({ ...form, gameName: e.target.value })}
              required
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              placeholder="소환사명"
            />
            <span className="flex items-center text-gray-500 text-xl">#</span>
            <input
              type="text"
              value={form.tagLine}
              onChange={(e) => setForm({ ...form, tagLine: e.target.value })}
              required
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              placeholder="KR1"
            />
          </div>
        </div>

        {/* Peak Tier S15 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            S15(2025) 최고 티어
          </label>
          <div className="flex gap-2">
            <select
              value={form.peakTierS15}
              onChange={(e) => {
                const tier = e.target.value;
                setForm({
                  ...form,
                  peakTierS15: tier,
                  peakRankS15: isHighTier(tier) ? "I" : form.peakRankS15,
                });
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">선택 안 함</option>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {TIER_LABELS[tier]}
                </option>
              ))}
            </select>
            {form.peakTierS15 && !isHighTier(form.peakTierS15) && (
              <select
                value={form.peakRankS15}
                onChange={(e) =>
                  setForm({ ...form, peakRankS15: e.target.value })
                }
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">단계</option>
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Preferred Positions */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            선호 포지션 (복수 선택 가능)
          </label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => togglePosition(pos.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  form.preferredPositions.includes(pos.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {pos.icon} {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            소개 (선택)
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none resize-none"
            rows={3}
            placeholder="간단한 자기소개, 플레이 스타일 등"
            maxLength={200}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition"
        >
          {loading ? "가입 처리 중..." : "회원가입"}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="text-blue-400 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
