import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - HYUFA",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-wider text-[#6c727f]">
          PRIVACY POLICY
        </p>
        <h1 className="text-[20px] font-bold text-white">개인정보처리방침</h1>
        <p className="text-[12px] text-[#6c727f] mt-1">
          시행일자: 2026년 4월 16일
        </p>
      </header>

      <article className="space-y-6 text-[12.5px] leading-relaxed text-[#cdd1d8]">
        <p>
          HYUFA(이하 &ldquo;서비스&rdquo;)는 한양대학교 리그오브레전드 교내 대회를
          위한 비영리 도구입니다. 운영자는 이용자의 개인정보를 「개인정보 보호법」
          등 관계 법령에 따라 안전하게 처리하기 위해 본 방침을 수립·공개합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <Sub title="가. 회원가입 시 (필수)">
            <ul className="list-disc list-inside space-y-1">
              <li>아이디 (username)</li>
              <li>비밀번호 (bcrypt로 단방향 해시되어 저장, 평문 저장 안 함)</li>
              <li>휴대폰 번호 (한 명당 한 계정 정책 시행 목적)</li>
              <li>
                라이엇 게임즈 계정 정보: 소환사명(gameName), 태그라인(tagLine),
                PUUID, SummonerId
              </li>
              <li>
                League of Legends 시즌별 티어·랭크·LP·솔로랭크 판수
                (2025시즌·2026시즌)
              </li>
            </ul>
          </Sub>
          <Sub title="나. 회원가입 시 (선택)">
            <ul className="list-disc list-inside space-y-1">
              <li>선호 포지션</li>
              <li>자기소개 글 (bio)</li>
            </ul>
          </Sub>
          <Sub title="다. 서비스 이용 과정에서 자동 수집">
            <ul className="list-disc list-inside space-y-1">
              <li>접속 로그, 이용 기록</li>
              <li>이용자가 작성한 게시글(팀 모집글), 컨택 신청, 메시지</li>
              <li>티어 갱신 요청 시각, FA 마켓 노출 여부</li>
            </ul>
          </Sub>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="list-disc list-inside space-y-1">
            <li>회원 식별 및 로그인 인증</li>
            <li>중복 가입 방지(한 명당 한 계정 원칙)</li>
            <li>
              라이엇 API를 통한 시즌 티어 자동 조회 및 LCMC 팀 점수 산정
            </li>
            <li>
              FA 마켓·팀 모집·컨택·메시지 등 서비스 핵심 기능 제공
            </li>
            <li>부정 이용·다중 가입 등에 대한 제재 및 분쟁 처리</li>
          </ul>
        </Section>

        <Section title="3. 휴대폰 번호 수집·이용에 관한 별도 고지">
          <p>
            본 서비스는 한양대 교내 대회의 공정성을 위해 한 명당 한 계정만
            가입할 수 있도록 휴대폰 번호를 unique 식별자로 저장합니다. 휴대폰
            번호는 다음과 같이 처리됩니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>광고·마케팅 목적으로 사용하지 않습니다.</li>
            <li>제3자에게 제공되지 않습니다.</li>
            <li>SMS 발송 등 외부 통신에 이용되지 않습니다.</li>
            <li>
              이용자 본인의 마이페이지·관리자 페이지 외에는 노출되지 않습니다.
            </li>
          </ul>
        </Section>

        <Section title="4. 개인정보의 보유 및 이용 기간">
          <ul className="list-disc list-inside space-y-1">
            <li>
              회원 정보는 회원 탈퇴 시까지 보유하며, 탈퇴 요청 시 즉시 파기합니다.
            </li>
            <li>
              단, 부정 이용(다중 가입·계정 도용·악성 이용 등)이 확인된 경우,
              재발 방지를 위해 휴대폰 번호 해시값 등 최소한의 식별 정보를
              <strong> 최대 1년</strong>간 보관할 수 있습니다.
            </li>
            <li>
              관련 법령에 따른 보존 의무가 있는 경우 해당 법령이 정한 기간 동안
              보관합니다.
            </li>
          </ul>
        </Section>

        <Section title="5. 개인정보의 제3자 제공">
          <p>
            서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
            다만 다음의 경우는 예외로 합니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              FA 마켓 및 팀 모집 게시판에서 이용자가 자발적으로 노출에 동의한
              정보(소환사명, 태그라인, 티어, 선호 포지션, 자기소개)는 다른
              회원에게 공개됩니다.
            </li>
            <li>법령에 따른 요청이 있거나 수사 목적으로 적법한 절차에 따라 요구된 경우</li>
          </ul>
        </Section>

        <Section title="6. 개인정보 처리의 위탁">
          <p>
            서비스 운영을 위해 다음 외부 처리업체에 일부 데이터를 위탁
            처리합니다. 휴대폰 번호와 비밀번호 해시는 외부로 전송되지 않습니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Riot Games, Inc.</strong> — 소환사명·태그라인을 통한
              라이엇 계정 검증, PUUID 조회, 솔로랭크 티어·판수 조회
            </li>
            <li>
              <strong>fow.kr (FOW.LOL)</strong> — 2025시즌(S15) 최고 티어 조회
            </li>
            <li>
              <strong>Vercel Inc.</strong> — 호스팅 및 서버리스 함수 실행
            </li>
            <li>
              <strong>Neon (PostgreSQL)</strong> — 데이터베이스 호스팅
              (대한민국 서울 리전)
            </li>
          </ul>
        </Section>

        <Section title="7. 개인정보의 파기 절차 및 방법">
          <ul className="list-disc list-inside space-y-1">
            <li>
              파기 절차: 이용자가 탈퇴를 요청하면 보유 기간 경과 또는 처리 목적
              달성 후 지체 없이 파기합니다.
            </li>
            <li>
              파기 방법: 전자적 파일은 복구 불가능한 방법으로 영구 삭제하며,
              종이 출력물은 분쇄 또는 소각합니다.
            </li>
          </ul>
        </Section>

        <Section title="8. 이용자의 권리와 행사 방법">
          <p>
            이용자는 언제든지 본인의 개인정보에 대해 다음 권리를 행사할 수
            있습니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>개인정보 열람 요구</li>
            <li>오류 정정 요구</li>
            <li>삭제 요구 (회원 탈퇴)</li>
            <li>처리 정지 요구</li>
          </ul>
          <p className="mt-2">
            마이페이지에서 직접 정정·수정할 수 있으며, 그 외 사항은 아래 보호책임자
            연락처로 요청해 주시면 지체 없이 조치합니다.
          </p>
        </Section>

        <Section title="9. 만 14세 미만 아동의 개인정보">
          <p>
            서비스는 만 14세 미만 아동의 회원가입을 받지 않으며, 14세 미만의
            개인정보를 수집하지 않습니다.
          </p>
        </Section>

        <Section title="10. 개인정보의 안전성 확보 조치">
          <ul className="list-disc list-inside space-y-1">
            <li>비밀번호는 bcrypt 알고리즘(cost 12)으로 단방향 해시 저장</li>
            <li>관리자 권한 최소화 및 접근 제어</li>
            <li>모든 통신은 HTTPS(TLS) 암호화 채널로 전송</li>
            <li>
              데이터베이스 접근 자격증명은 환경변수로 관리되며 코드에 노출되지
              않음
            </li>
          </ul>
        </Section>

        <Section title="11. 개인정보 보호책임자 및 문의처">
          <ul className="list-none space-y-1">
            <li>
              <strong>책임자:</strong> 김영준
            </li>
            <li>
              <strong>이메일:</strong>{" "}
              <a
                href="mailto:peteryoung0414@gmail.com"
                className="text-[#e08a3c] hover:underline"
              >
                peteryoung0414@gmail.com
              </a>
            </li>
          </ul>
          <p className="mt-3">
            기타 개인정보 침해에 대한 신고 및 상담이 필요한 경우, 아래 기관에
            문의해 주시기 바랍니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              개인정보침해신고센터 ({" "}
              <a
                href="https://privacy.kisa.or.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5ea4ff] hover:underline"
              >
                privacy.kisa.or.kr
              </a>{" "}
              / 국번없이 118)
            </li>
            <li>
              개인정보보호위원회 ({" "}
              <a
                href="https://www.pipc.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5ea4ff] hover:underline"
              >
                pipc.go.kr
              </a>{" "}
              / 국번없이 1833-6972)
            </li>
            <li>
              경찰청 사이버수사국 ({" "}
              <a
                href="https://ecrm.police.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5ea4ff] hover:underline"
              >
                ecrm.police.go.kr
              </a>{" "}
              / 국번없이 182)
            </li>
          </ul>
        </Section>

        <Section title="12. 방침의 변경">
          <p>
            본 방침은 법령·서비스의 변경에 따라 개정될 수 있으며, 변경 시
            시행일자 7일 전부터 서비스 내 공지사항을 통해 안내합니다.
          </p>
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

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12.5px] font-semibold text-[#cdd1d8] mb-1">{title}</h3>
      {children}
    </div>
  );
}
