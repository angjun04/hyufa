import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getSetting, setSetting, SETTING_KEYS, isS16Locked } from "@/lib/settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  }

  const [deadline, locked] = await Promise.all([
    getSetting(SETTING_KEYS.S16_DEADLINE),
    isS16Locked(),
  ]);
  return NextResponse.json({
    s16Deadline: deadline,
    s16Locked: locked,
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 404 });
  }

  const body = await req.json();
  const { s16Deadline } = body;

  if (s16Deadline !== undefined) {
    if (s16Deadline === null || s16Deadline === "") {
      await setSetting(SETTING_KEYS.S16_DEADLINE, "");
    } else {
      const d = new Date(s16Deadline);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "올바른 날짜 형식이 아닙니다." },
          { status: 400 }
        );
      }
      await setSetting(SETTING_KEYS.S16_DEADLINE, d.toISOString());
    }
  }

  return NextResponse.json({ ok: true });
}
