import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: { gameId: string; score: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.gameId || typeof body.score !== "number" || body.score < 0) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const score = Math.floor(body.score);
  const supabase = getSupabaseAdmin();

  const { data: game } = await supabase
    .from("games")
    .select("high_score")
    .eq("id", body.gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (score > (game.high_score || 0)) {
    await supabase
      .from("games")
      .update({ high_score: score })
      .eq("id", body.gameId);

    return NextResponse.json({ highScore: score, isNew: true });
  }

  return NextResponse.json({ highScore: game.high_score || 0, isNew: false });
}
