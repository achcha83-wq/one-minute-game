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

      const { data: deleted } = await supabase
        .from("game_pool")
        .delete()
        .eq("id", poolGame.id)
        .select();

      if (deleted && deleted.length > 0) {
        const id = nanoid(10);
        const html = injectMobileFixes(poolGame.html);

        const row = { id, name: poolGame.name, html, tier: config.tier, play_count: 1, created_at: new Date().toISOString() };
        const { error: insErr } = await supabase.from("games").insert(row);
        if (insErr) {
          const { play_count: _, ...rowNoPC } = row;
          await supabase.from("games").insert(rowNoPC);
        }

        await logEvent("pool_hit", config.tier, {
          gameId: id,
          name: poolGame.name,
          latencyMs: Date.now() - t0,
        });

        return NextResponse.json({
          id,
          name: poolGame.name,
          html,
          fromPool: true,
        });
      }
    }
  } catch (err) {
    await logEvent("pool_error", config.tier, {
      error: err instanceof Error ? err.message : "Unknown",
    });
  }

  // Fallback: generate live
  await logEvent("pool_miss", config.tier, { fallback: "live_generation" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await logEvent("error", config.tier, { error: "ANTHROPIC_API_KEY not configured" });
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

    // Fetch recent games to avoid repeats
    let avoidList = "";
    try {
      const { data: recent } = await supabase
        .from("games")
        .select("name")
        .eq("tier", config.tier)
        .order("created_at", { ascending: false })
        .limit(5);
      if (recent && recent.length > 0) {
        avoidList = `\nDo NOT make any of these games (already played): ${recent.map((g) => g.name).join(", ")}. Pick something COMPLETELY DIFFERENT.\n`;
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
        stream: true,
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
      await logEvent("api_error", config.tier, {
        status: res.status,
        detail: errText.slice(0, 500),
        latencyMs: Date.now() - t0,
      });
      return NextResponse.json(
        { error: `Claude API error: ${res.status}`, detail: errText },
        { status: 502 },
      );
    }

    let raw = "";
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "content_block_delta" && event.delta?.text) {
                raw += event.delta.text;
              }
            } catch { /* skip non-JSON lines */ }
          }
        }
      }
    }

    if (raw.length > 0) {
      const html = injectMobileFixes(cleanHtml(raw));
      const name = extractTitle(html);
      const id = nanoid(10);

      const row2 = { id, name, html, tier: config.tier, play_count: 1, created_at: new Date().toISOString() };
      const { error: insErr2 } = await supabase.from("games").insert(row2);
      if (insErr2) {
        const { play_count: _, ...rowNoPC2 } = row2;
        await supabase.from("games").insert(rowNoPC2);
      }

      await logEvent("live_generation", config.tier, {
        gameId: id,
        name,
        latencyMs: Date.now() - t0,
      });

      return NextResponse.json({ id, name, html, fromPool: false });
    }

    await logEvent("empty_response", config.tier, {
      error: "Empty streamed response",
      latencyMs: Date.now() - t0,
    });
    return NextResponse.json(
      { error: "Empty response from AI" },
      { status: 502 },
    );
  } catch (err) {
    const latencyMs = Date.now() - t0;
    if (err instanceof Error && err.name === "AbortError") {
      await logEvent("timeout", config.tier, { latencyMs });
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 },
      );
    }
    await logEvent("error", config.tier, {
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
