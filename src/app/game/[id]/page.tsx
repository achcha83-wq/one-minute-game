import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

async function getGame(id: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("games")
    .select("id, name, html, tier, created_at")
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  return {
    title: game ? `${game.name} — One Minute Game` : "Game Not Found",
    description: game
      ? `Play "${game.name}" — a Tier ${game.tier} game built by AI in ${game.tier} minute${game.tier > 1 ? "s" : ""}.`
      : "This game doesn't exist.",
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#0b0b1a", color: "#e4e4f0",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: 20, textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>Game not found</h1>
        <p style={{ fontSize: 14, color: "#6b6b8d", margin: "0 0 24px 0" }}>
          This game doesn&apos;t exist or has been removed.
        </p>
        <a href="/" style={{
          background: "#22c55e", color: "#0b0b1a", padding: "14px 28px",
          borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none",
        }}>Make Your Own</a>
      </div>
    );
  }

  return <GameViewer name={game.name} html={game.html} tier={game.tier} />;
}

function GameViewer({ name, html, tier }: { name: string; html: string; tier: number }) {
  const tierColors = ["#22c55e", "#f97316", "#a855f7"];
  const color = tierColors[tier - 1] || "#22c55e";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 16px", background: "rgba(17,17,17,0.95)", flexShrink: 0,
        borderBottom: "1px solid #222",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: color, color: "#0b0b1a", padding: "2px 8px",
            borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "monospace",
          }}>T{tier}</span>
          <span style={{ color: "#e4e4f0", fontSize: 14, fontWeight: 600 }}>{name}</span>
        </div>
        <a href="/" style={{
          background: "none", border: "1px solid #444", color: "#ccc",
          padding: "6px 14px", borderRadius: 8, fontSize: 12, textDecoration: "none",
        }}>Make Your Own</a>
      </div>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        title={name}
        style={{ flex: 1, width: "100%", border: "none", background: "#000" }}
      />
    </div>
  );
}
