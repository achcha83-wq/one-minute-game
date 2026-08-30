import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Try with play_count first; fall back without it if column doesn't exist yet
    const { data, error } = await supabase
      .from("games")
      .select("id, name, tier, high_score, play_count, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      const fallback = await supabase
        .from("games")
        .select("id, name, tier, high_score, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      return NextResponse.json({ games: fallback.data || [] });
    }

    return NextResponse.json({ games: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
