"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { POSITIONS } from "@/lib/tierScore";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    gameName: "",
    tagLine: "",
    preferredPositions: [] as string[],
    bio: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(form.username)) {
      setError("아이디는 영문/숫자/_ 4~20자여야 합니다.");
      return;
    }
    const phone = form.phoneNumber.replace(/[-\s]/g, "");
    if (!/^010\d{8}$/.test(phone)) {
      setError("올바른 휴대폰 번호 형식이 아닙니다 (예: 01012345678).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          phoneNumber: phone,
          gameName: form.gameName,
          tagLine: form.tagLine,
          preferredPositions: form.preferredPositions,
          bio: form.bio || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "회원가입 중 오류가 발생했습니다.");
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
      <h1 className="text-2xl font-bold text-center mb-2">회원가입</h1>
      <p className="text-center text-gray-500 text-sm mb-8">
        라이엇 계정을 통해 시즌 티어가 자동으로 등록됩니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Username */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">아이디</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoComplete="username"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            placeholder="영문/숫자/_ 4~20자"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="new-password"
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
            autoComplete="new-password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            휴대폰 번호
          </label>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm({ ...form, phoneNumber: e.target.value })
            }
            required
            autoComplete="tel"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            placeholder="01012345678"
          />
          <p className="text-xs text-gray-500 mt-1">
            한 명당 한 계정만 가입할 수 있습니다. (인증은 추후 도입 예정)
          </p>
        </div>

        {/* Riot ID */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            라이엇 ID
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
          <p className="text-xs text-gray-500 mt-1">
            라이엇 API로 실제 계정인지 확인하고 S15 / S16 티어를 자동으로 가져옵니다.
          </p>
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
