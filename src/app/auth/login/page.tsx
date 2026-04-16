"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    if (result?.error) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    } else {
      router.push("/mypage");
      router.refresh();
    }
  };

  const inputCls =
    "w-full bg-[#0b0d11] border border-[#232830] rounded px-3 py-2.5 text-[14px] text-white focus:border-[#e08a3c] focus:outline-none";

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-[20px] font-bold text-white mb-1">로그인</h1>
      <p className="text-[12px] text-[#6c727f] mb-6">계속하려면 계정이 필요합니다</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="bg-[#e3603f]/10 border border-[#e3603f]/40 text-[#e3603f] text-[12px] p-2.5 rounded">
            {error}
          </div>
        )}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">아이디</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#6c727f] mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e08a3c] hover:bg-[#f09a48] disabled:opacity-50 text-black py-2.5 rounded font-semibold text-[13px] transition"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="text-center text-[#6c727f] text-[12px] mt-6">
        계정이 없으신가요?{" "}
        <Link href="/auth/register" className="text-[#e08a3c] hover:underline font-medium">
          회원가입
        </Link>
      </p>
    </div>
  );
}
