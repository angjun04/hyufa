import { auth } from "./auth";
import { SUPERADMIN_ID } from "./adminConst";

export interface AdminContext {
  username: string;
}

/**
 * API 라우트에서 사용. 슈퍼어드민(env 기반)이 아니면 null 반환.
 * 호출 측에서 404 등으로 처리하여 어드민 존재 자체를 노출하지 않음.
 */
export async function requireAdmin(): Promise<AdminContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.id !== SUPERADMIN_ID) return null;
  return { username: session.user.name ?? "admin" };
}

/** 세션이 슈퍼어드민인지 boolean. 페이지 컴포넌트 등에서 사용. */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.id === SUPERADMIN_ID;
}
