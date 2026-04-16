"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "점수 계산기" },
  { href: "/fa", label: "FA 마켓" },
  { href: "/recruit", label: "팀 모집" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav className="bg-[#0b0d11] border-b border-[#232830] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Brand + nav */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="text-base font-bold tracking-tight mr-6 text-white"
            >
              HYU<span className="text-[#e08a3c]">FA</span>
            </Link>
            <div className="hidden md:flex items-center">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] font-medium transition relative ${
                    isActive(item.href)
                      ? "text-white"
                      : "text-[#a3a8b3] hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute left-2 right-2 -bottom-[13px] h-[2px] bg-[#e08a3c]" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right cluster */}
          <div className="hidden md:flex items-center gap-2">
            {session?.user ? (
              <>
                <Link
                  href="/mypage"
                  className={`px-3 py-1.5 text-[13px] font-medium transition ${
                    isActive("/mypage")
                      ? "text-white"
                      : "text-[#a3a8b3] hover:text-white"
                  }`}
                >
                  {session.user.name ?? "마이페이지"}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-[12px] text-[#6c727f] hover:text-[#e3603f] transition px-2"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[13px] text-[#a3a8b3] hover:text-white transition px-3 py-1.5"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="text-[13px] bg-[#e08a3c] hover:bg-[#f09a48] text-black font-semibold px-3 py-1.5 rounded transition"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#a3a8b3] hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="메뉴"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-2 border-t border-[#232830] -mx-4 px-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block py-2 text-sm ${
                  isActive(item.href) ? "text-white" : "text-[#a3a8b3]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#232830] space-y-1">
              {session?.user ? (
                <>
                  <Link
                    href="/mypage"
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm text-white"
                  >
                    {session.user.name}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block py-2 text-sm text-[#6c727f]"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm text-[#a3a8b3]"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm text-[#e08a3c] font-semibold"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
