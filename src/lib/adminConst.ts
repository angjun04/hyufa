// auth.ts는 서버 전용 의존성(prisma)이 있어 클라이언트에서 임포트 불가.
// 세션 id sentinel만 별도 파일로 분리해 양쪽 모두에서 임포트 가능하게 함.
export const SUPERADMIN_ID = "__superadmin__";
