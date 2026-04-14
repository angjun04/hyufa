"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-blue-400">
              HYU<span className="text-yellow-400">FA</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition text-sm"
              >
                점수 계산기
              </Link>
              <Link
                href="/fa"
                className="text-gray-300 hover:text-white transition text-sm"
              >
                FA 마켓
              </Link>
              <Link
                href="/recruit"
                className="text-gray-300 hover:text-white transition text-sm"
              >
                소환사 모집
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {session?.user ? (
              <>
                <Link
                  href="/mypage"
                  className="text-gray-300 hover:text-white transition text-sm"
                >
                  마이페이지
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-red-400 transition"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                로그인
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block text-gray-300 hover:text-white py-2 text-sm" onClick={() => setMenuOpen(false)}>
              점수 계산기
            </Link>
            <Link href="/fa" className="block text-gray-300 hover:text-white py-2 text-sm" onClick={() => setMenuOpen(false)}>
              FA 마켓
            </Link>
            <Link href="/recruit" className="block text-gray-300 hover:text-white py-2 text-sm" onClick={() => setMenuOpen(false)}>
              소환사 모집
            </Link>
            {session?.user ? (
              <>
                <Link href="/mypage" className="block text-gray-300 hover:text-white py-2 text-sm" onClick={() => setMenuOpen(false)}>
                  마이페이지
                </Link>
                <button onClick={() => signOut()} className="block text-gray-400 hover:text-red-400 py-2 text-sm">
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="block text-blue-400 hover:text-blue-300 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                로그인
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
