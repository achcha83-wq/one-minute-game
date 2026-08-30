import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TIER_CONFIGS } from "@/lib/tier-config";
import { injectMobileFixes, extractTitle, cleanHtml } from "@/lib/game-helpers";

export async function POST(req: NextRequest) {
  let body: { tier: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tierIdx = (body.tier || 1) - 1;
  if (tierIdx < 0 || tierIdx >= TIER_CONFIGS.length) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const config = TIER_CONFIGS[tierIdx];

  // Try the pool first
  try {
    const { data: poolGames } = await supabase
      .from("game_pool")
      .select("*")
      .eq("tier", config.tier)
      .order("created_at", { ascending: true })
      .limit(1);

    if (poolGames && poolGames.length > 0) {
      const poolGame = poolGames[0];

      // Claim it (delete from pool)
      const { data: deleted } = await supabase
        .from("game_pool")
        .delete()
        .eq("id", poolGame.id)
        .select();

      if (deleted && deleted.length > 0) {
        const id = nanoid(10);
        const html = injectMobileFixes(poolGame.html);

        await supabase.from("games").insert({
          id,
          name: poolGame.name,
          html,
          tier: config.tier,
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          id,
          name: poolGame.name,
          html,
          fromPool: true,
        });
      }
    }
  } catch {
    // Pool table might not exist yet — fall through to live generation
  }

  // Fallback: generate live
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 200_000);

  try {
    const seed =
      Math.random().toString(36).slice(2, 10) +
      "-" +
      Date.now().toString(36);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.modelId,
        max_tokens: config.maxTokens,
        messages: [
          {
            role: "user",
            content: `Random seed (use this to make your choice unpredictable): ${seed}\n\n${config.prompt}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Claude API error: ${res.status}`, detail: errText },
        { status: 502 },
      );
    }

    const data = await res.json();

    if (data.content && data.content.length > 0) {
      let raw = data.content
        .map((c: { text?: string }) => c.text || "")
        .join("");
      const html = injectMobileFixes(cleanHtml(raw));
      const name = extractTitle(html);
      const id = nanoid(10);

      await supabase.from("games").insert({
        id,
        name,
        html,
        tier: config.tier,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ id, name, html, fromPool: false });
    }

    return NextResponse.json(
      { error: data.error?.message || "Empty response from AI" },
      { status: 502 },
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
