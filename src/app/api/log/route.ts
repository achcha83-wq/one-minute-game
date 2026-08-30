import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event || "unknown";
    const tier = typeof body.tier === "number" ? body.tier : undefined;
    const { event: _, tier: __, ...rest } = body;
    await logEvent(event, tier, Object.keys(rest).length > 0 ? rest : undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
