import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "HYUFA - 한양대 LoL 교내전",
  description:
    "한양대학교 리그오브레전드 교내 대회 점수 계산 및 FA 마켓",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#232830] py-6 mt-12">
            <div className="max-w-5xl mx-auto px-4 text-[11px] text-[#6c727f] flex flex-wrap items-center justify-between gap-2">
              <span>© 2026 HYUFA · 한양대 LoL 교내전 비공식 도구</span>
              <div className="flex items-center gap-3">
                <Link href="/terms" className="hover:text-white transition">
                  이용약관
                </Link>
                <span className="text-[#3a414c]">·</span>
                <Link href="/privacy" className="hover:text-white transition">
                  개인정보처리방침
                </Link>
              </div>
            </div>
            <div className="max-w-5xl mx-auto px-4 mt-2 text-[10px] text-[#3a414c]">
              hyufa isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
              opinions of Riot Games.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
