// AppSetting 키-값 저장소 헬퍼
import { prisma } from "./prisma";

export const SETTING_KEYS = {
  S16_DEADLINE: "S16_DEADLINE", // ISO datetime string (KST 권장)
  S16_LOCKED: "S16_LOCKED", // "true" | "false"
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function isS16Locked(): Promise<boolean> {
  const v = await getSetting(SETTING_KEYS.S16_LOCKED);
  return v === "true";
}

export async function getS16Deadline(): Promise<Date | null> {
  const v = await getSetting(SETTING_KEYS.S16_DEADLINE);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
