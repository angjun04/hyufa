import { auth } from "./auth";
import { prisma } from "./prisma";

export interface AdminContext {
  userId: string;
  username: string;
}

/**
 * API 라우트에서 사용. 어드민 아니면 null 반환 → 호출 측에서 401/404 처리.
 */
export async function requireAdmin(): Promise<AdminContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, isAdmin: true },
  });
  if (!user?.isAdmin) return null;

  return { userId: user.id, username: user.username };
}
