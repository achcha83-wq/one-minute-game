import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: { prompt: string; seed: string; tier: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 200_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        messages: [
          {
            role: "user",
            content: `Random seed (use this to make your choice unpredictable): ${body.seed}\n\n${body.prompt}`,
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
      let html = data.content
        .map((c: { text?: string }) => c.text || "")
        .join("");
      html = html.replace(/^[\s\S]*?(<!DOCTYPE)/i, "$1");
      html = html.replace(/```\s*$/, "").trim();

      const m = html.match(/<title>(.*?)<\/title>/i);
      const name = m ? m[1] : "Mystery Game";
      const id = nanoid(10);

      const supabase = getSupabaseAdmin();
      const { error: dbError } = await supabase.from("games").insert({
        id,
        name,
        html,
        tier: body.tier ?? 1,
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        return NextResponse.json(
          { error: `Failed to save game: ${dbError.message}` },
          { status: 500 },
        );
      }

      return NextResponse.json({ id, name, html });
    }

    return NextResponse.json(
      { error: data.error?.message || "Empty response from AI" },
      { status: 502 },
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
