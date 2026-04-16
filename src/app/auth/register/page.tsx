"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { POSITIONS } from "@/lib/tierScore";

const inputCls =
  "w-full bg-[#0b0d11] border border-[#232830] rounded px-3 py-2.5 text-[14px] text-white focus:border-[#e08a3c] focus:outline-none";

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
    if (form.password !== form.passwordConfirm) return setError("비밀번호가 일치하지 않습니다.");
    if (form.password.length < 6) return setError("비밀번호는 6자 이상이어야 합니다.");
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(form.username))
      return setError("아이디는 영문/숫자/_ 4~20자여야 합니다.");
    const phone = form.phoneNumber.replace(/[-\s]/g, "");
    if (!/^010\d{8}$/.test(phone))
      return setError("올바른 휴대폰 번호 형식이 아닙니다 (예: 01012345678).");

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
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-[20px] font-bold text-white mb-1">회원가입</h1>
      <p className="text-[12px] text-[#6c727f] mb-6">
        라이엇 계정으로 시즌 티어가 자동 등록됩니다
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-[#e3603f]/10 border border-[#e3603f]/40 text-[#e3603f] text-[12px] p-2.5 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">아이디</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoComplete="username"
            className={inputCls}
            placeholder="영문/숫자/_ 4~20자"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
              className={inputCls}
              placeholder="6자 이상"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">확인</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required
              autoComplete="new-password"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">휴대폰 번호</label>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            required
            autoComplete="tel"
            className={inputCls}
            placeholder="01012345678"
          />
          <p className="text-[10px] text-[#6c727f] mt-1">한 명당 한 계정만 가입 가능합니다</p>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">라이엇 ID</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={form.gameName}
              onChange={(e) => setForm({ ...form, gameName: e.target.value })}
              required
              className={`flex-1 ${inputCls}`}
              placeholder="소환사명"
            />
            <span className="self-center text-[#6c727f]">#</span>
            <input
              type="text"
              value={form.tagLine}
              onChange={(e) => setForm({ ...form, tagLine: e.target.value })}
              required
              className={`w-20 ${inputCls}`}
              placeholder="KR1"
            />
          </div>
          <p className="text-[10px] text-[#6c727f] mt-1">
            라이엇 API로 검증 + S15/S16 티어 자동 조회
          </p>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1.5">선호 포지션</label>
          <div className="flex flex-wrap gap-1.5">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => togglePosition(pos.value)}
                className={`px-2.5 py-1 rounded text-[12px] transition border ${
                  form.preferredPositions.includes(pos.value)
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
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">소개 (선택)</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            maxLength={200}
            placeholder="플레이 스타일, 가능 시간 등"
            className={`w-full resize-none ${inputCls}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black py-2.5 rounded font-semibold text-[13px] transition"
        >
          {loading ? "가입 처리 중..." : "회원가입"}
        </button>
      </form>

      <p className="text-center text-[#6c727f] text-[12px] mt-6">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="text-[#e08a3c] hover:underline font-medium">
          로그인
        </Link>
      </p>
    </div>
  );
}
