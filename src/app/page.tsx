import ScoreCalculator from "@/components/ScoreCalculator";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-3">
          HYU<span className="text-blue-400">FA</span>
        </h1>
        <p className="text-gray-400 text-lg">
          한양대학교 LoL 교내전 점수 계산 & FA 마켓
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link
          href="/fa"
          className="bg-blue-600/20 border border-blue-600/40 rounded-xl p-5 hover:bg-blue-600/30 transition text-center"
        >
          <span className="text-2xl block mb-2">🎮</span>
          <h3 className="font-bold text-blue-400">FA 마켓</h3>
          <p className="text-gray-400 text-xs mt-1">팀을 찾는 소환사</p>
        </Link>
        <Link
          href="/recruit"
          className="bg-yellow-600/20 border border-yellow-600/40 rounded-xl p-5 hover:bg-yellow-600/30 transition text-center"
        >
          <span className="text-2xl block mb-2">📋</span>
          <h3 className="font-bold text-yellow-400">소환사 모집</h3>
          <p className="text-gray-400 text-xs mt-1">팀원을 구하는 팀</p>
        </Link>
      </div>

      {/* Score Calculator */}
      <ScoreCalculator />

      <p className="text-center text-gray-600 text-xs mt-8">
        본 사이트는 한양대학교 교내 리그오브레전드 대회를 위해 제작되었습니다.
      </p>
    </div>
  );
}
