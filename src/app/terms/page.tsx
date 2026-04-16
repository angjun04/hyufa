import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - HYUFA",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">
          TERMS OF SERVICE
        </p>
        <h1 className="text-[20px] font-bold text-white">이용약관</h1>
        <p className="text-[12px] text-[#6c727f] mt-1">
          시행일자: 2026년 4월 16일
        </p>
      </header>

      <article className="space-y-6 text-[12.5px] leading-relaxed text-[#cdd1d8]">
        <Section title="제1조 (목적)">
          <p>
            본 약관은 HYUFA(이하 &ldquo;서비스&rdquo;)가 제공하는 한양대학교
            리그오브레전드 교내전 점수계산·FA 마켓·팀 모집 도구의 이용에 관하여
            서비스와 이용자 간 권리·의무 및 책임 사항, 기타 필요한 사항을 정함을
            목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>서비스</strong>: HYUFA 웹사이트(hyufa.vercel.app) 및
              관련 기능 일체
            </li>
            <li>
              <strong>이용자</strong>: 본 약관에 따라 서비스에 가입하여 제공되는
              기능을 이용하는 회원
            </li>
            <li>
              <strong>운영자</strong>: 서비스를 기획·운영하는 자
              (개인정보처리방침 11조 참조)
            </li>
            <li>
              <strong>라이엇 계정</strong>: Riot Games, Inc.가 제공하는
              League of Legends 계정 (gameName#tagLine)
            </li>
            <li>
              <strong>FA 마켓</strong>: 팀을 찾는 이용자가 본인 정보를 자발
              공개하는 게시판 형태의 기능
            </li>
            <li>
              <strong>컨택</strong>: 이용자 간 팀 합류·모집 의사 전달 기능
            </li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ul className="list-disc list-inside space-y-1">
            <li>
              본 약관은 회원가입 시 동의함으로써 효력이 발생합니다.
            </li>
            <li>
              운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수
              있으며, 개정 시 시행일자 7일 전부터 서비스 내 공지합니다.
            </li>
            <li>
              개정된 약관에 동의하지 않는 이용자는 회원 탈퇴를 통해 이용을 중단할
              수 있습니다.
            </li>
          </ul>
        </Section>

        <Section title="제4조 (회원가입 및 계약 성립)">
          <ul className="list-disc list-inside space-y-1">
            <li>
              회원가입은 이용자가 본 약관 및 개인정보처리방침에 동의하고 서비스가
              요구하는 정보를 정확히 입력함으로써 성립합니다.
            </li>
            <li>
              본 서비스는 한양대 교내 대회의 공정성을 위해 <strong>한 명당 한
              계정</strong>의 가입만을 허용하며, 동일한 휴대폰 번호 또는 동일한
              라이엇 계정으로 다중 가입할 수 없습니다.
            </li>
            <li>
              만 14세 미만의 회원가입은 받지 않습니다.
            </li>
          </ul>
        </Section>

        <Section title="제5조 (서비스의 제공)">
          <p>서비스는 다음 기능을 제공합니다.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>LCMC 팀 점수 계산기</li>
            <li>FA 마켓 (팀을 찾는 이용자 노출)</li>
            <li>팀 모집 게시판</li>
            <li>이용자 간 컨택 신청 및 메시지 기능</li>
            <li>Riot Games API를 통한 시즌별 티어 자동 조회 및 갱신</li>
            <li>fow.kr 등 외부 데이터 소스를 통한 과거 시즌 피크 티어 조회</li>
          </ul>
        </Section>

        <Section title="제6조 (이용자의 의무)">
          <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>타인의 계정·휴대폰 번호·라이엇 계정 도용</li>
            <li>다중 계정 생성 및 이용</li>
            <li>허위 정보 등록 또는 점수 조작 시도</li>
            <li>욕설·희롱·차별·성적 표현 등 다른 이용자에게 불쾌감을 주는 행위</li>
            <li>스팸성 컨택·메시지·게시글 작성</li>
            <li>
              서비스의 자동화된 크롤링·해킹·취약점 공격 등 정상 운영을 방해하는
              행위
            </li>
            <li>본 서비스를 영리 목적으로 무단 이용하는 행위</li>
            <li>관계 법령 및 본 약관을 위반하는 일체의 행위</li>
          </ul>
        </Section>

        <Section title="제7조 (게시물의 관리)">
          <ul className="list-disc list-inside space-y-1">
            <li>
              이용자가 작성한 모집글·메시지·자기소개 등 게시물에 대한 책임은
              해당 이용자에게 있습니다.
            </li>
            <li>
              운영자는 본 약관 또는 관계 법령에 위배되는 게시물을 사전 통지
              없이 삭제하거나 비공개 처리할 수 있습니다.
            </li>
          </ul>
        </Section>

        <Section title="제8조 (이용 제한 및 계정 해지)">
          <ul className="list-disc list-inside space-y-1">
            <li>
              제6조의 의무를 위반한 이용자에 대하여 운영자는 사전 통지 없이
              경고·일시 정지·계정 해지 등의 조치를 취할 수 있습니다.
            </li>
            <li>
              이용자는 마이페이지 또는 운영자 이메일을 통해 언제든지 회원 탈퇴를
              요청할 수 있으며, 운영자는 지체 없이 처리합니다.
            </li>
            <li>
              부정 이용으로 해지된 이용자의 재가입 방지를 위해, 운영자는 휴대폰
              번호의 단방향 해시값 등 최소한의 식별 정보를 최대 1년간 보관할 수
              있습니다.
            </li>
          </ul>
        </Section>

        <Section title="제9조 (면책 조항)">
          <ul className="list-disc list-inside space-y-1">
            <li>
              본 서비스는 Riot Games, Inc.의 공식 후원·승인을 받지 않은
              비공식·비영리 도구이며, League of Legends 및 Riot Games의 견해를
              대변하지 않습니다.
            </li>
            <li>
              Riot Games API, fow.kr 등 외부 서비스의 장애·정책 변경·데이터 오류로
              인한 서비스 중단·정보 부정확성에 대해 운영자는 책임을 지지 않습니다.
            </li>
            <li>
              FA 마켓·컨택·메시지 등 이용자 간 의사 교환 과정에서 발생한 분쟁에
              대해 운영자는 개입하지 않으며, 책임을 지지 않습니다.
            </li>
            <li>
              점수 계산 결과는 참고 수치이며, 실제 대회 점수의 최종 결정은 대회
              운영진의 판단에 따릅니다.
            </li>
          </ul>
        </Section>

        <Section title="제10조 (준거법 및 관할 법원)">
          <ul className="list-disc list-inside space-y-1">
            <li>본 약관의 해석 및 적용은 대한민국 법령에 따릅니다.</li>
            <li>
              서비스 이용과 관련하여 분쟁이 발생한 경우, 민사소송법상 관할
              법원에 소를 제기합니다.
            </li>
          </ul>
        </Section>

        <p className="text-[#6c727f] pt-4 border-t border-[#232830]">
          공고일자: 2026년 4월 16일 · 시행일자: 2026년 4월 16일
        </p>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[13px] font-bold text-white mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
