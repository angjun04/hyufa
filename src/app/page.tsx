import ScoreCalculator from "@/components/ScoreCalculator";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Hero */}
      <header className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight">
          HYU<span className="text-[#e08a3c]">FA</span>
          <span className="ml-2 text-[13px] font-medium text-[#6c727f] align-middle">
            한양대 LoL 교내전 점수계산 · FA 마켓
          </span>
        </h1>
      </header>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/fa"
          className="group flex items-center justify-between bg-[#14171d] border border-[#232830] hover:border-[#3a414c] rounded-md px-4 py-3 transition"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">FREE AGENT</p>
            <p className="text-sm font-bold text-white">FA 마켓</p>
          </div>
          <svg className="w-4 h-4 text-[#6c727f] group-hover:text-[#e08a3c]" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l5 5-5 5V5z"/></svg>
        </Link>
        <Link
          href="/recruit"
          className="group flex items-center justify-between bg-[#14171d] border border-[#232830] hover:border-[#3a414c] rounded-md px-4 py-3 transition"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">RECRUIT</p>
            <p className="text-sm font-bold text-white">팀 모집 게시판</p>
          </div>
          <svg className="w-4 h-4 text-[#6c727f] group-hover:text-[#e08a3c]" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l5 5-5 5V5z"/></svg>
        </Link>
      </div>

      {/* Score Calculator */}
      <ScoreCalculator />
    </div>
  );
}
