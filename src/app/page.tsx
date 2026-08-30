"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const TIERS = [
  {
    target: 20,
    label: "20 SEC",
    sub: "Lightning round",
    color: "#22c55e",
    model: "haiku",
    prompt: `You are a game developer. Create a FUN, PLAYABLE browser game. Pick ONE random concept — use the random seed to choose unpredictably, do NOT always pick the first: clicker game, reaction speed test, whack-a-mole, color matching, balloon popping, catch falling items, quick math challenge, emoji catcher.

CRITICAL REQUIREMENTS:
- Output ONLY the complete HTML. Start with <!DOCTYPE html>. No explanation, no markdown, no backticks.
- Single self-contained HTML file with ALL CSS in <style> and ALL JS in <script>
- THIS GAME WILL BE PLAYED ON A MOBILE PHONE. There is NO keyboard, NO arrow keys, NO mouse hover.
- ALL controls MUST be touch-based: tap, swipe, drag, or on-screen buttons. Never require keyboard input.
- Use touch events (touchstart, touchmove, touchend) with { passive: false } and preventDefault() to stop scrolling
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Fill entire viewport (100vw x 100vh), no scrolling, overflow:hidden on body
- Large tap targets (min 48px) for mobile fingers
- Visible score counter
- Vibrant colors on dark background (#111 or similar)
- requestAnimationFrame for animation
- Game over state with Play Again button
- Start screen with big START button
- Creative title in <title> tag
- The game must be COMPLETE and FULLY FUNCTIONAL.`,
  },
  {
    target: 30,
    label: "30 SEC",
    sub: "Quick & fun",
    color: "#f97316",
    model: "sonnet",
    prompt: `You are a game developer. Create a FUN, PLAYABLE browser game. Pick ONE random concept — use the random seed to choose unpredictably, do NOT always pick the first: snake, breakout brick breaker, memory card matching, space invaders, bubble shooter, tower stacker, asteroid shooter, pong with twists, dodge falling objects, shooting gallery, color flood fill, simon says memory.

CRITICAL REQUIREMENTS:
- Output ONLY the complete HTML. Start with <!DOCTYPE html>. No explanation, no markdown, no backticks.
- Single self-contained HTML file with ALL CSS in <style> and ALL JS in <script>
- THIS GAME WILL BE PLAYED ON A MOBILE PHONE. There is NO keyboard, NO arrow keys, NO mouse hover.
- ALL controls MUST be touch-based: tap to shoot/select, swipe to move, drag to aim, or on-screen D-pad/buttons. NEVER require keyboard input.
- Use touch events (touchstart, touchmove, touchend) with { passive: false } and preventDefault() to stop page scrolling
- For movement games: add a visible on-screen joystick or D-pad using touch drag
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Fill entire viewport (100vw x 100vh), prevent scrolling with overflow:hidden on body
- Scoring system with best score tracking in a variable
- Vibrant colors, smooth animations on dark background
- Use Canvas API for rendering
- Start screen with title + instructions + big START button. Game over screen with score + PLAY AGAIN button.
- requestAnimationFrame for 60fps
- Give the game a creative title in the <title> tag
- IMPORTANT: The game must be COMPLETE and FULLY FUNCTIONAL. Every feature must work.`,
  },
  {
    target: 60,
    label: "1 MIN",
    sub: "Go all out",
    color: "#a855f7",
    model: "sonnet",
    prompt: `You are an expert game developer. Create an IMPRESSIVE, POLISHED browser game. Pick ONE random concept — use the random seed to choose unpredictably: roguelike dungeon crawler, tower defense, RPG battle arena, physics puzzle, survival waves, bullet hell shooter, platformer, maze runner, tetris-inspired, rhythm action game, puzzle platformer, match-3 with twists.

CRITICAL REQUIREMENTS:
- Output ONLY the complete HTML. Start with <!DOCTYPE html>. No explanation, no markdown, no backticks.
- Single self-contained HTML file with ALL CSS in <style> and ALL JS in <script>
- THIS GAME WILL BE PLAYED ON A MOBILE PHONE. There is NO keyboard, NO arrow keys, NO mouse hover.
- ALL controls MUST be 100% touch-based. Implement visible on-screen virtual controls:
  * D-pad or virtual joystick (rendered on canvas) for movement — tracks finger drag via touchmove
  * Action buttons (attack, jump, shoot) as large tappable circles on the right side
  * Use touch events (touchstart, touchmove, touchend) with { passive: false } and preventDefault()
  * Support multi-touch so player can move AND act simultaneously
  * NEVER rely on keyboard, arrow keys, WASD, or mouse — they don't exist on phones
- Use viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
- Fill entire viewport (100vw x 100vh), prevent all scrolling
- Canvas API for all rendering
- Complex scoring, upgrades or progression
- Multiple game states: menu, playing, paused, game over
- HUD with score/level/health — positioned at the TOP CENTER, away from virtual controls
- Multiple enemy types with different behaviors
- requestAnimationFrame at 60fps
- Sound effects via Web Audio API oscillators (create AudioContext on first user touch)
- Particle effects for explosions/impacts
- Power-ups or special abilities
- Vibrant palette on dark background, glow effects
- Give the game a creative title in the <title> tag
- IMPORTANT: The game must be COMPLETE and FULLY FUNCTIONAL. Do not cut corners or leave stubs.`,
  },
];

const MESSAGES = [
  ["Spinning up...", "Almost there..."],
  ["Rolling the dice...", "Wiring up the fun...", "Applying pixel dust...", "Almost ready..."],
  ["Imagining worlds...", "Spawning enemies...", "Building arenas...", "Adding particles...", "Composing sounds...", "Final polish..."],
];

type AppState = "idle" | "generating" | "holding" | "ready" | "error";

type SavedGame = { id: string; name: string; tier: number; created_at: string };

export default function Page() {
  const [state, setState] = useState<AppState>("idle");
  const [tierIdx, setTierIdx] = useState<number | null>(null);
  const [gameHtml, setGameHtml] = useState("");
  const [gameName, setGameName] = useState("");
  const [gameId, setGameId] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [loadMsg, setLoadMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentGames, setRecentGames] = useState<SavedGame[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIdx = useRef(0);
  const startT = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const buffered = useRef<{ html: string; name: string; id: string } | null>(null);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((d) => { if (d.games) setRecentGames(d.games); })
      .catch(() => {});
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const generate = useCallback(async (idx: number) => {
    const tier = TIERS[idx];
    const msgs = MESSAGES[idx];
    const target = tier.target;

    setTierIdx(idx);
    setState("generating");
    setElapsed(0);
    setGameHtml("");
    setGameName("");
    setGameId("");
    setErrMsg("");
    setCopied(false);
    setFullscreen(false);
    msgIdx.current = 0;
    setLoadMsg(msgs[0]);
    buffered.current = null;

    startT.current = Date.now();

    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startT.current) / 1000);
      setElapsed(s);

      const iv = Math.max(Math.floor(target / msgs.length), 4);
      const ni = Math.min(Math.floor(s / iv), msgs.length - 1);
      if (ni !== msgIdx.current) {
        msgIdx.current = ni;
        setLoadMsg(msgs[ni]);
      }

      if (s >= target) {
        if (buffered.current) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setGameHtml(buffered.current.html);
          setGameName(buffered.current.name);
          setGameId(buffered.current.id);
          setElapsed(target);
          setState("ready");
        } else {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          if (abortRef.current) abortRef.current.abort();
          setElapsed(target);
          setErrMsg("AI couldn't finish in time — try again or pick a longer tier");
          setState("error");
        }
      }
    }, 250);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const seed = Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
      const res = await fetch("/api/generate-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ prompt: tier.prompt, seed, tier: idx + 1, model: tier.model }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      if (data.html && data.id) {
        const now = Math.floor((Date.now() - startT.current) / 1000);
        if (now >= target) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setElapsed(target);
          setGameHtml(data.html);
          setGameName(data.name || "Mystery Game");
          setGameId(data.id);
          setState("ready");
        } else {
          buffered.current = { html: data.html, name: data.name || "Mystery Game", id: data.id };
          setState("holding");
        }

        setRecentGames((prev) => {
          const newGame: SavedGame = {
            id: data.id,
            name: data.name || "Mystery Game",
            tier: idx + 1,
            created_at: new Date().toISOString(),
          };
          return [newGame, ...prev.filter((g) => g.id !== data.id)].slice(0, 30);
        });
      } else {
        throw new Error(data.error || "Empty response");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setErrMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, []);

  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
  };

  const shareGame = async () => {
    const url = `${window.location.origin}/game/${gameId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: gameName, text: `Play "${gameName}" — built by AI`, url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard failed */ }
  };

  const playFullPage = () => {
    window.open(`/game/${gameId}`, "_blank");
  };

  const fmt = (s: number) => s >= 60
    ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
    : `0:${s.toString().padStart(2, "0")}`;
  const tc = tierIdx !== null ? TIERS[tierIdx].color : "#e4e4f0";
  const target = tierIdx !== null ? TIERS[tierIdx].target : 60;
  const progress = Math.min(elapsed / target, 1);

  if (fullscreen && state === "ready") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 16px", background: "rgba(17,17,17,0.95)", flexShrink: 0,
          borderBottom: "1px solid #222",
        }}>
          <span style={{ color: "#e4e4f0", fontSize: 14, fontWeight: 600 }}>{gameName}</span>
          <button onClick={() => setFullscreen(false)} style={{
            background: "none", border: "1px solid #444", color: "#ccc",
            padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer",
          }}>Exit</button>
        </div>
        <iframe srcDoc={gameHtml} sandbox="allow-scripts allow-same-origin" title={gameName}
          style={{ flex: 1, width: "100%", border: "none", background: "#000" }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#0b0b1a", color: "#e4e4f0",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px", WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* IDLE */}
        {state === "idle" && <>
          <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 16 }}>
            <div style={{
              fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
              color: "#6b6b8d", marginBottom: 12, fontFamily: "monospace",
            }}>One Minute Game</div>
            <h1 style={{
              fontSize: 28, fontWeight: 700, lineHeight: 1.15,
              margin: "0 0 10px 0",
            }}>Press a button.<br />Get a game.</h1>
            <p style={{ fontSize: 14, color: "#6b6b8d", lineHeight: 1.5, margin: 0 }}>
              No prompts. No input. Pick how long<br />the AI thinks — then play what comes out.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TIERS.map((t, i) => {
              const tierGames = recentGames.filter((g) => g.tier === i + 1);
              return (
                <div key={i}>
                  <button onClick={() => generate(i)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "20px 22px", background: "#151530", border: "1px solid #2a2a4a",
                    borderRadius: 16, cursor: "pointer", color: "#e4e4f0",
                    WebkitTapHighlightColor: "transparent", outline: "none", width: "100%",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 800, color: "#0b0b1a",
                        background: t.color, flexShrink: 0, fontFamily: "monospace",
                      }}>{i + 1}</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 17, fontWeight: 600 }}>{t.label}</div>
                        <div style={{ fontSize: 13, color: "#6b6b8d", marginTop: 2 }}>{t.sub}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 20, color: "#6b6b8d" }}>→</span>
                  </button>

                  {tierGames.length > 0 && (
                    <GameThumbnailRow games={tierGames} color={t.color} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "#3a3a5a" }}>
            Powered by Claude · Every game is unique
          </div>
        </>}

        {/* GENERATING / HOLDING */}
        {(state === "generating" || state === "holding") && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 60, textAlign: "center",
          }}>
            <div style={{ position: "relative", width: 180, height: 180, marginBottom: 20 }}>
              <svg width="180" height="180" viewBox="0 0 180 180"
                style={{ transform: "rotate(-90deg)" }}>
                <circle cx="90" cy="90" r="82" fill="none" stroke="#1a1a3a" strokeWidth="6" />
                <circle cx="90" cy="90" r="82" fill="none" stroke={tc} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 82}`}
                  strokeDashoffset={`${2 * Math.PI * 82 * (1 - progress)}`}
                  style={{ transition: "stroke-dashoffset 0.3s ease" }} />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  fontSize: 42, fontWeight: 700, fontFamily: "monospace",
                  color: tc, letterSpacing: 2,
                }}>{fmt(elapsed)}</div>
                <div style={{ fontSize: 11, color: "#6b6b8d", fontFamily: "monospace" }}>
                  / {fmt(target)}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 14, marginBottom: 8, minHeight: 22,
              color: state === "holding" ? tc : "#6b6b8d",
              fontWeight: state === "holding" ? 600 : 400,
            }}>
              {state === "holding" ? "Game ready — revealing at the clock..." : loadMsg}
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: tc,
                  animation: `rgm-pulse 1.4s ease infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>

            <button onClick={cancel} style={{
              background: "none", border: "1px solid #2a2a4a", color: "#6b6b8d",
              padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontSize: 14,
            }}>Cancel</button>
          </div>
        )}

        {/* READY */}
        {state === "ready" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
          }}>
            <div style={{
              fontSize: 20, fontWeight: 700, marginTop: 8, marginBottom: 4, textAlign: "center",
            }}>{gameName}</div>
            <div style={{
              fontSize: 12, color: "#6b6b8d", marginBottom: 14,
              fontFamily: "monospace", textAlign: "center",
            }}>Built in {fmt(elapsed)} · Tier {(tierIdx ?? 0) + 1}</div>

            <div style={{
              width: "100%", height: "60dvh", borderRadius: 14, overflow: "hidden",
              border: "1px solid #2a2a4a", background: "#000", marginBottom: 14,
            }}>
              <iframe srcDoc={gameHtml} sandbox="allow-scripts allow-same-origin" title={gameName}
                style={{ width: "100%", height: "100%", border: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button onClick={() => setFullscreen(true)} style={{
                padding: "16px 20px", borderRadius: 14, border: "1px solid #2a2a4a",
                background: "#151530", fontSize: 15, fontWeight: 600,
                cursor: "pointer", color: "#e4e4f0",
              }}>⛶</button>
              <button onClick={playFullPage} style={{
                flex: 1, padding: 16, borderRadius: 14, border: "none",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                color: "#0b0b1a", background: tc,
              }}>Play</button>
              <button onClick={shareGame} style={{
                flex: 1, padding: 16, borderRadius: 14, border: "1px solid #2a2a4a",
                background: "#151530", fontSize: 15, fontWeight: 600,
                cursor: "pointer", color: copied ? "#22c55e" : "#e4e4f0",
                transition: "color 0.2s",
              }}>{copied ? "Link Copied!" : "Share"}</button>
              <button onClick={() => { setState("idle"); setFullscreen(false); }} style={{
                padding: "16px 20px", borderRadius: 14, border: "1px solid #2a2a4a",
                background: "#151530", fontSize: 15, fontWeight: 600,
                cursor: "pointer", color: "#6b6b8d",
              }}>+</button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 60, textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700 }}>
              Generation failed
            </h2>
            <p style={{
              fontSize: 13, color: "#6b6b8d", margin: "0 0 24px 0",
              maxWidth: 280, lineHeight: 1.5,
            }}>{errMsg}</p>
            <button onClick={() => setState("idle")} style={{
              background: tc, border: "none", color: "#0b0b1a",
              padding: "14px 28px", borderRadius: 12, fontSize: 15,
              fontWeight: 600, cursor: "pointer",
            }}>Try Again</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rgm-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function GameThumbnailRow({ games, color }: { games: SavedGame[]; color: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);
  const cols = 4;
  const maxVisible = cols * 2;
  const hasMore = games.length > maxVisible;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowArrow(el.scrollWidth > el.clientWidth);
  }, [games]);

  const scroll = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative", marginTop: 8, marginBottom: 4 }}>
      <div
        ref={scrollRef}
        style={{
          display: "grid",
          gridTemplateRows: "repeat(2, 1fr)",
          gridAutoFlow: "column",
          gridAutoColumns: "72px",
          gap: 6,
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: 4,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {games.slice(0, hasMore ? undefined : maxVisible).map((g) => (
          <a
            key={g.id}
            href={`/game/${g.id}`}
            style={{
              width: 72, height: 40, borderRadius: 8,
              background: "#1a1a36", border: `1px solid ${color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none", overflow: "hidden", padding: "0 4px",
            }}
          >
            <span style={{
              fontSize: 10, color: "#999", textAlign: "center",
              lineHeight: 1.2, overflow: "hidden",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              wordBreak: "break-word" as const,
            }}>{g.name}</span>
          </a>
        ))}
      </div>

      {(hasMore || showArrow) && (
        <button
          onClick={scroll}
          style={{
            position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(11,11,26,0.9)", border: `1px solid ${color}66`,
            color, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >→</button>
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
