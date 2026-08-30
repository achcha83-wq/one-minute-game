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

  const config = TIER_CONFIGS[tierIdx];
  const supabase = getSupabaseAdmin();

  // Check current pool size for this tier
  try {
    const { count } = await supabase
      .from("game_pool")
      .select("id", { count: "exact", head: true })
      .eq("tier", config.tier);

    if (count !== null && count >= 2) {
      return NextResponse.json({ status: "pool full", count });
    }
  } catch {
    // Pool table might not exist — try to generate anyway, insert will fail gracefully
  }

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

      const { error: dbError } = await supabase.from("game_pool").insert({
        id,
        name,
        html,
        tier: config.tier,
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        return NextResponse.json(
          { error: `Failed to save to pool: ${dbError.message}` },
          { status: 500 },
        );
      }

      return NextResponse.json({ status: "replenished", name, tier: config.tier });
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
