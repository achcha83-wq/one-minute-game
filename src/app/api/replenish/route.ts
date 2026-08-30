import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TIER_CONFIGS } from "@/lib/tier-config";
import { injectMobileFixes, extractTitle, cleanHtml } from "@/lib/game-helpers";
import { logEvent } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const t0 = Date.now();
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

  try {
    const { count } = await supabase
      .from("game_pool")
      .select("id", { count: "exact", head: true })
      .eq("tier", config.tier);

    if (count !== null && count >= 2) {
      return NextResponse.json({ status: "pool full", count });
    }
  } catch {
    // Pool table might not exist — try to generate anyway
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await logEvent("replenish_error", config.tier, { error: "ANTHROPIC_API_KEY not configured" });
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const seed =
      Math.random().toString(36).slice(2, 10) +
      "-" +
      Date.now().toString(36);

    let avoidList = "";
    try {
      const { data: recent } = await supabase
        .from("games")
        .select("name")
        .eq("tier", config.tier)
        .order("created_at", { ascending: false })
        .limit(5);
      const { data: pooled } = await supabase
        .from("game_pool")
        .select("name")
        .eq("tier", config.tier);
      const names = [
        ...(recent || []).map((g) => g.name),
        ...(pooled || []).map((g) => g.name),
      ];
      if (names.length > 0) {
        avoidList = `\nDo NOT make any of these games (already exist): ${names.join(", ")}. Pick something COMPLETELY DIFFERENT.\n`;
      }
    } catch { /* ignore */ }

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
            content: `Random seed (use this to make your choice unpredictable): ${seed}${avoidList}\n\n${config.prompt}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      await logEvent("replenish_api_error", config.tier, {
        status: res.status,
        detail: errText.slice(0, 500),
        latencyMs: Date.now() - t0,
      });
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
        await logEvent("replenish_db_error", config.tier, {
          error: dbError.message,
          latencyMs: Date.now() - t0,
        });
        return NextResponse.json(
          { error: `Failed to save to pool: ${dbError.message}` },
          { status: 500 },
        );
      }

      await logEvent("replenish_success", config.tier, {
        name,
        latencyMs: Date.now() - t0,
      });
      return NextResponse.json({ status: "replenished", name, tier: config.tier });
    }

    await logEvent("replenish_empty", config.tier, { latencyMs: Date.now() - t0 });
    return NextResponse.json(
      { error: data.error?.message || "Empty response from AI" },
      { status: 502 },
    );
  } catch (err) {
    const latencyMs = Date.now() - t0;
    if (err instanceof Error && err.name === "AbortError") {
      await logEvent("replenish_timeout", config.tier, { latencyMs });
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 },
      );
    }
    await logEvent("replenish_error", config.tier, {
      error: err instanceof Error ? err.message : "Unknown",
      latencyMs,
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
