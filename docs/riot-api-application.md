# Riot Games Production API Key Application — HYUFA

이 문서는 https://developer.riotgames.com/app-type 에서 **Personal API Key** 또는 **Production API Key**를 신청할 때 폼에 그대로 복붙할 수 있도록 작성되었습니다.

---

## 1. App Information

### Product Name
HYUFA — Hanyang University LoL FA Market & Score Calculator

### Product URL
https://hyufa.vercel.app  *(배포 후 실제 도메인으로 교체)*

### Product Group
Personal — Educational/Community Project

### Application Tags (suggested)
- Tournament Tooling
- Stat / Tier Lookup
- Community

---

## 2. Product Description

> 영문판과 한글판을 모두 준비. Riot은 영문 폼을 요구하지만, 한국 지역사회 도구임을 어필하기 위해 한글 설명도 함께 첨부 가능합니다.

### English (recommended for the application form)

HYUFA is a non-commercial web application built exclusively for the **Hanyang University internal League of Legends tournament (LCMC — League of Champions Mech-CSE, a competition between the Mechanical Engineering and Computer Science & Engineering departments)**. It serves a small, closed community of approximately 60–150 student participants per season.

The application provides three core functions:

1. **Free-Agent (FA) Marketplace** — students who are not yet on a roster can mark themselves as "looking for a team" and team captains can browse and contact them. Communication is in-app via a private messaging system between accepted contact pairs.

2. **Team Recruitment Board** — captains post recruitment notices listing required positions and tier ranges; players apply via the same contact request flow.

3. **LCMC Team Point Calculator** — a tier-weighted scoring system used by the tournament to enforce a per-team budget cap of 170 points (heavier rank → more points; teams of 5 must stay under the cap). The Riot API is used to (a) verify that each registrant owns the Riot account they claim, (b) automatically determine the player's current ranked tier so the score is fair and not self-reported, and (c) periodically snapshot each registrant's peak rank during the active season so the captain budget reflects actual skill at the application deadline.

The Riot API is used **only for registered users of HYUFA who voluntarily submitted their Riot ID during signup**, plus on-demand lookups in the score calculator (entered manually by the user). Calls are aggressively cached at the PUUID level (TTL 30 minutes by default; "force refresh" rate-limited to 30 seconds per user) and there are no background or batch jobs that walk the entire ladder.

### 한국어 (참고용)

HYUFA는 한양대학교 교내 리그 오브 레전드 대회(LCMC)를 위해 만든 비영리 웹 도구입니다. 매 시즌 60~150명 규모의 폐쇄적 학생 커뮤니티를 대상으로 하며, FA 마켓 / 팀 모집 / 팀 포인트 계산기 세 가지 기능을 제공합니다. 라이엇 API는 (1) 회원가입 시 라이엇 계정 실존 확인, (2) 시즌 중 현재 티어 자동 조회, (3) 점수 계산기의 닉네임 기반 티어 조회에만 사용되며, 모든 호출은 PUUID 단위로 캐싱(기본 30분, 강제 갱신은 30초 throttle)됩니다.

---

## 3. API Endpoints Used

| Endpoint | Region | Purpose | Frequency |
|---|---|---|---|
| `/riot/account/v1/accounts/by-riot-id/{name}/{tag}` | `asia` | 가입 시 계정 검증 + PUUID 획득. 점수계산기에서 처음 보는 닉네임 lookup. | 사용자당 가입 1회 + 계산기 lookup (캐시 miss 시) |
| `/lol/summoner/v4/summoners/by-puuid/{puuid}` | `kr` | 부가 메타데이터 (실패해도 fallback) | 가입 시 1회 |
| `/lol/league/v4/entries/by-puuid/{puuid}` | `kr` | 솔로랭크 티어 조회 | 가입 1회 + 사용자 수동 갱신 시 (30초 throttle, 30분 stale TTL) |

> 우리는 모든 응답을 `TierCache`라는 PostgreSQL 테이블에 PUUID 키로 저장합니다. 동일 PUUID에 대한 두 번째 요청은 캐시 TTL 안에 들어오면 라이엇 API를 호출하지 않습니다.

### Endpoints we DO NOT use
- match-v5, spectator-v5, champion-mastery, tournament-v5 — 사용 안 함.
- 어떤 형태의 ladder scrape, leaderboard polling, cron-driven mass refresh도 없음.

---

## 4. Expected Traffic

- **Concurrent users**: 매 시즌 신청 마감 1~2일 동안 최대 ~50 동시 사용자.
- **Riot API rate**: 평균 시간당 < 60 requests, 최대 burst (모집 마지막 날) 시간당 < 300 requests. 모두 사용자 행동 기반 (자동 폴링 없음). Personal Key의 100 req/2min, 20 req/sec 한도 안에서 충분.
- **Total per season**: 가입 1회 × 150명 + 평균 갱신 10회 × 150명 + 계산기 lookup 약 500회 ≈ **시즌당 2000~3000 requests**.

---

## 5. Compliance with Riot API Policies

- **No public ranked rankings or leaderboards** — 우리 사이트에 노출되는 모든 정보는 본인이 직접 가입하여 동의한 사용자에 한정됩니다.
- **No advertising / monetization** — 어떤 광고, 결제, 구독, 후원 시스템도 없음.
- **No commercial use** — 학생회 동아리 운영비 외 수익 0원.
- **PII storage** — 이메일은 저장하지 않습니다. 휴대폰 번호는 명의당 1계정 정책을 위해 저장하나 어드민 외 노출되지 않습니다.
- **Account name display** — Riot ID (gameName#tagLine)는 사용자 동의 하에만 다른 회원에게 노출됩니다.
- **Display of last updated time** — 모든 티어 정보 옆에 마지막 갱신 시각이 표시됩니다 (Riot API 가이드라인 준수).
- **Account verification** — 가입 시 Riot Account v1 API로 PUUID를 검증하여 실제 본인 계정만 등록 가능하게 합니다 (단, Riot이 권장하는 OAuth/RSO 흐름은 아직 도입하지 않음 — 향후 ROADMAP 항목).

---

## 6. Future Plans & Roadmap

| 우선순위 | 항목 | 비고 |
|---|---|---|
| 1 | RSO(Sign In with Riot) 통합 | 현재는 닉네임 입력만 받지만 Production Key 발급 후 도입 예정. 본인 인증 강도 ↑. |
| 2 | 휴대폰 SMS OTP 인증 | 명의당 1계정 정책 강화. 현재는 unique 제약만. |
| 3 | 시즌 마감 자동 lock (Vercel Cron) | 어드민 수동 트리거 → 마감 시각 자동화. |
| 4 | 다른 한양대학교 e-sports 동아리(스타크래프트, 발로란트)로 확장 시 별도 키로 분리. |

---

## 7. Tech Stack

- Next.js 16 (App Router) + React 19, TypeScript
- PostgreSQL (Neon) + Prisma 5
- NextAuth v5 (Credentials provider, JWT session)
- Cheerio (fow.lol 시즌 종료 peak HTML 파싱 — 라이엇 공식 API가 종료 시즌 데이터를 제공하지 않기 때문)
- Vercel deployment (Fluid Compute Functions)

소스 코드: https://github.com/angjun04/hyufa  *(공개 레포로 전환 시 링크 정확성 확인)*

---

## 8. Contact

- **Maintainer**: Angjun Park (한양대학교 학생, LCMC 대회 운영진)
- **Email**: *(신청 폼 작성 시 본인 이메일 입력)*
- **Country / Region**: South Korea (KR + ASIA platform)

---

## 신청 워크플로우

1. https://developer.riotgames.com/ 에서 Riot 계정으로 로그인.
2. **Personal API Key** 신청부터 시작 (즉시 발급, 수개월 유지 가능).
3. 사이트 트래픽 안정화 후 **Production API Key** 신청 (위 폼 사용 — 검토 1~4주).
4. 신청 시 첨부 자료:
   - 사이트 라이브 URL (회원가입 가능 상태)
   - 위 product description 본문
   - 사이트 메인 페이지 + 마이페이지 + 점수계산기 스크린샷 3장
5. 발급 후 `.env.local`의 `RIOT_API_KEY`를 새 키로 교체 + Vercel 환경변수 동기화.

---

## 부록: 현재 캐싱 전략 상세 (Riot이 자주 묻는 질문)

```
사용자 행동             →  라이엇 호출 횟수
─────────────────────  ─────────────────
회원가입 (1회)          →  account v1 (1) + summoner v4 (1) + league v4 (1) = 3
가입 후 마이페이지 갱신   →  league v4 (1)  (단, 30초 throttle + 30분 stale TTL)
점수계산기 닉네임 조회   →  cache miss: account v1 (1) + summoner v4 (1) + league v4 (1) = 3
                       →  cache hit (30분 내): 0
시즌 lock 작업          →  0 (DB only — 캐시 데이터를 User 테이블로 복사)
```

이 캐싱 정책은 단일 PUUID에 대해 라이엇 API rate limit (20 req/sec, 100 req/2min)을 절대 초과하지 않도록 설계되어 있습니다.
